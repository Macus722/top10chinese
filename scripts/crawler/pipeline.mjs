// Orchestrates one weekly crawl cycle for Top 10 Chinese (全球十大华人): walk the fresh (not
// already crawled) candidates from the configured sources (36氪, 虎嗅), rewrite the first one
// that is genuinely about a notable Chinese company / founder / business-world development into
// 全球十大华人's 深度观察 editorial template (rewrite.mjs, Simplified Chinese output), resolve a
// featured image, and insert one row into the shared Supabase `articles` table as
// country_code=T10C, status 'approved' (live immediately). At most ONE article per run. Runs as
// a plain Node script inside a GitHub Actions job (see run.mjs).
//
// The sources also carry stories that aren't a good fit (product reviews, consumer how-tos,
// pure policy explainers). rewriteArticleContent() returns { offTopic: true } for those, and
// the loop below moves to the next candidate rather than failing the run.
//
// Publishing policy: always auto-publish, no held-for-review state. The safety gate
// (safety-gate.mjs) still runs and records gate_score/similarity, but is informational only.
//
// Dedup: source_url is unique in the DB (mcn-database/schema.sql). A candidate whose source_url
// is already present (any status, any country) is skipped -- checked against the
// `crawled_source_urls` view (not the raw `articles` table, which anon can't SELECT under RLS).
import { randomUUID } from "node:crypto";
import { COUNTRY_CODE, supabase } from "./lib/supabase.mjs";
import { getErrorMessage } from "./lib/errors.mjs";
import { todayCN } from "./lib/dates.mjs";
import { SOURCES } from "./sources/index.mjs";
import { rewriteArticleContent, generateSeoMetadataWithRetry } from "./rewrite.mjs";
import { resolveArticleImage } from "./image-gen.mjs";
import { runSafetyGate } from "./safety-gate.mjs";

const MAX_CANDIDATES_PER_SOURCE = 12;
const ARTICLE_CATEGORY = "深度观察";

// Ceiling on how many candidates a single run will scrape + attempt to rewrite before giving up
// -- bounds the Firecrawl + Claude spend on a quiet week where everything fresh is off-topic.
const MAX_REWRITE_ATTEMPTS = 8;

// Skip any candidate whose source article is older than this. 36氪 / 虎嗅 both carry a publish
// (or, for 虎嗅, a modified) timestamp, so this gate is a real backstop against a stale link
// resurfacing on a section index -- the DB unique source_url constraint prevents an exact
// re-crawl, but a slow news week could otherwise surface a month-old story as "fresh".
const MAX_ARTICLE_AGE_DAYS = 45;

/** @param {string | null} publishedAt @returns {boolean} */
function isStale(publishedAt) {
  if (!publishedAt) return false; // page carries no date -> can't judge, don't reject on that alone
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  return ageMs > MAX_ARTICLE_AGE_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * @template T
 * @param {string} stage
 * @param {() => Promise<T>} task
 * @returns {Promise<T>}
 */
async function runStage(stage, task) {
  try {
    return await task();
  } catch (error) {
    console.error(`[crawler] stage "${stage}" threw:`, getErrorMessage(error));
    throw error;
  }
}

/** @param {string} sourceUrl @returns {Promise<boolean>} */
async function isAlreadyCrawled(sourceUrl) {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("crawled_source_urls")
    .select("source_url")
    .eq("source_url", sourceUrl)
    .maybeSingle();
  if (error) {
    console.error(`[crawler] isAlreadyCrawled check failed for ${sourceUrl}:`, getErrorMessage(error));
    return false;
  }
  return Boolean(data);
}

/**
 * Lazily yields fresh (not already crawled, not stale, successfully scraped) candidates across
 * every source in order. Scrapes one at a time so a run only pays for what it consumes.
 * @param {import("./types.mjs").NewsSource[]} sources
 * @returns {AsyncGenerator<{source: import("./types.mjs").NewsSource, sourceUrl: string, article: import("./types.mjs").FetchedArticle}>}
 */
async function* freshCandidates(sources) {
  for (const source of sources) {
    console.log(`[crawler] checking source: ${source.name}`);
    const urls = await runStage(`source:${source.id}`, () => source.listRecent(MAX_CANDIDATES_PER_SOURCE));
    for (const sourceUrl of urls) {
      if (await isAlreadyCrawled(sourceUrl)) continue;

      const article = await source.fetchArticle(sourceUrl);
      if (!article) continue;

      if (isStale(article.publishedAt)) {
        console.log(
          `[crawler] ${source.id}: skipping stale article (${article.publishedAt?.slice(0, 10)}) ${sourceUrl}`,
        );
        continue;
      }

      yield { source, sourceUrl, article };
    }
  }
}

/**
 * @param {{ dryRun?: boolean }} [options] dryRun runs every stage (Firecrawl, rewrite, image,
 *   safety gate) but stops before the Supabase insert, logging the row it would have written --
 *   for verifying the pipeline without publishing. Invoked via `npm run crawl -- --dry-run`.
 * @returns {Promise<{status: string, source?: string, sourceUrl?: string, title?: string, reason?: string, gateScore?: number|null}>}
 */
export async function runCrawlCycle({ dryRun = false } = {}) {
  if (!supabase) {
    console.error("[crawler] Supabase not configured — aborting cycle.");
    return { status: "not-configured" };
  }

  let selected = null;
  let rewrite = null;
  let attempts = 0;

  for await (const candidate of freshCandidates(SOURCES)) {
    if (attempts >= MAX_REWRITE_ATTEMPTS) {
      console.log(`[crawler] reached MAX_REWRITE_ATTEMPTS (${MAX_REWRITE_ATTEMPTS}) — stopping search`);
      break;
    }
    attempts += 1;
    console.log(`[crawler] candidate ${attempts}: ${candidate.source.name} — ${candidate.sourceUrl}`);

    const result = await runStage("rewrite", () =>
      rewriteArticleContent(candidate.article.title, candidate.article.bodyText),
    );

    if (result?.offTopic) {
      console.log(`[crawler] off-topic (${result.reason}) — trying next candidate`);
      continue;
    }
    if (!result) {
      console.log("[crawler] rewrite produced no usable content — trying next candidate");
      continue;
    }

    selected = candidate;
    rewrite = result;
    break;
  }

  if (!selected || !rewrite) {
    console.log("[crawler] cycle finished — no usable on-topic candidate found this run");
    return { status: "no-candidate" };
  }

  console.log(`[crawler] selected: ${selected.source.name} — ${selected.sourceUrl}`);

  const seo = await runStage("seo-metadata", () =>
    generateSeoMetadataWithRetry(rewrite.title, rewrite.focusKeyphrase, rewrite.fullText),
  );
  const metaTitle = seo?.metaTitle ?? "";
  const metaDescription = seo?.metaDescription ?? "";
  const excerpt = seo?.excerpt ?? metaDescription;

  const imageUrl = await runStage("image-resolution", () =>
    resolveArticleImage(selected.article.imageUrl, rewrite.title, rewrite.imageAlt),
  );

  const gate = await runStage("safety-gate", () =>
    runSafetyGate(rewrite.fullText, selected.article.bodyText, { metaTitle, metaDescription }),
  );
  if (!gate.pass) {
    console.log(`[crawler] gate would have held this (${gate.reason}) — auto-publishing anyway per policy`);
  }

  const recordId = randomUUID();
  const row = {
    id: recordId,
    country_code: COUNTRY_CODE,
    status: "approved",
    slug: rewrite.slug,
    title: rewrite.title,
    category: ARTICLE_CATEGORY,
    meta_title: metaTitle,
    meta_description: metaDescription,
    excerpt,
    publish_date: todayCN(),
    body: rewrite.fullText,
    internal_links: rewrite.internalLinks,
    image_alt: rewrite.imageAlt,
    image_url: imageUrl,
    source: selected.source.id,
    source_url: selected.sourceUrl,
    gate_score: gate.gateScore,
    similarity: gate.similarity,
    standfirst: rewrite.standfirst,
    sections: rewrite.sections,
    faq_items: rewrite.faqItems,
    article_table: rewrite.table ?? null,
    focus_keyphrase: rewrite.focusKeyphrase,
  };

  if (dryRun) {
    console.log("[crawler] DRY RUN — pipeline succeeded, would insert this row (no write performed):");
    console.log(
      JSON.stringify(
        { ...row, body: `<${row.body.length} paragraphs>`, sections: row.sections, faq_items: row.faq_items },
        null,
        2,
      ),
    );
    return {
      status: "dry-run",
      source: selected.source.id,
      sourceUrl: selected.sourceUrl,
      title: rewrite.title,
      gateScore: gate.gateScore,
    };
  }

  try {
    const { error } = await supabase.from("articles").insert([row]);
    if (error) throw error;
  } catch (error) {
    console.error("[crawler] Supabase insert failed:", getErrorMessage(error));
    return {
      status: "rewrite-failed",
      source: selected.source.id,
      sourceUrl: selected.sourceUrl,
      title: rewrite.title,
      reason: getErrorMessage(error),
    };
  }

  console.log(`[crawler] PUBLISHED — slug: ${rewrite.slug}`);
  return {
    status: "published",
    source: selected.source.id,
    sourceUrl: selected.sourceUrl,
    title: rewrite.title,
    gateScore: gate.gateScore,
  };
}
