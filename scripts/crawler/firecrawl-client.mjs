// Thin wrapper around the Firecrawl SDK, ported verbatim in behavior from mcn-singapore's
// src/lib/crawler/firecrawl-client.ts. Firecrawl handles JS-rendering and anti-bot bypass
// server-side -- needed for the trade sources, same as every other MCN Group crawler.
import Firecrawl from "@mendable/firecrawl-js";

if (!process.env.FIRECRAWL_API_KEY) {
  console.warn("Warning: FIRECRAWL_API_KEY is not set. The article crawler will not work.");
}

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY || "" });

// Generic CMS fallback images ("no real photo for this article, here's our site logo/social-share
// graphic instead") aren't real content photos -- same filter as Singapore's version.
const GENERIC_IMAGE_PATTERN =
  /\/(default|placeholder|fallback|no[_-]?image|share|social|og)[_-]?(image|photo|share|social|thumb)?\.(png|jpe?g|webp|gif)$/i;

/** @param {string} url @returns {boolean} */
function isGenericPlaceholderImage(url) {
  return GENERIC_IMAGE_PATTERN.test(url);
}

/**
 * Discover the article links currently on a listing page (a site homepage or section index).
 *
 * Uses scrape(formats:["links"]) rather than map(): map() serves Firecrawl's cached view of a
 * site's link graph, which for these sources runs weeks stale (observed 2026-09-04: map() on
 * star.ettoday.net topped out at an article id ~6 weeks old, and returned a stray video page
 * for Yahoo). Scraping the live listing page returns the links actually rendered on it right
 * now. Never throws -- returns an empty array on failure so a single source outage doesn't
 * abort the whole crawl cycle.
 *
 * @param {string} listingUrl
 * @returns {Promise<string[]>} de-duplicated absolute URLs, in the order the page lists them
 */
export async function discoverArticleLinks(listingUrl) {
  try {
    const doc = await firecrawl.scrape(listingUrl, { formats: ["links"] });
    const links = Array.isArray(doc.links) ? doc.links : [];
    return [...new Set(links.filter((link) => typeof link === "string" && link.length > 0))];
  } catch (err) {
    console.error(`[crawler] discoverArticleLinks failed for ${listingUrl}:`, getMessage(err));
    return [];
  }
}

// Firecrawl surfaces a page's publish date under whichever metadata key the source's own markup
// uses -- OpenGraph article tags, schema.org JSON-LD, or a bare <meta name>. Checked in order;
// the first that parses to a real Date wins. Returns null when the page exposes no date at all
// (observed 2026-09-04: Yahoo奇摩新聞 article pages carry no publish timestamp), which the
// pipeline's freshness gate treats as "can't judge, allow" rather than a hard skip.
const PUBLISHED_AT_KEYS = [
  "publishedTime",
  "article:published_time",
  "datePublished",
  "pubdate",
  "publishdate",
  "my:publish_date", // 數位時代 / bnext.com.tw
  "date",
  // huxiu.com article pages expose no publish key, only a modified one -- accepted last as a
  // freshness proxy (better than null, which the pipeline treats as "can't judge, allow").
  "article:modified_time",
  "modifiedTime",
];

/** @param {Record<string, unknown> | undefined} metadata @returns {string | null} */
function extractPublishedAt(metadata) {
  if (!metadata) return null;
  for (const key of PUBLISHED_AT_KEYS) {
    const value = metadata[key];
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string" || !raw.trim()) continue;
    const parsed = new Date(raw.trim());
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

// A scrape can "succeed" against a CDN/origin error page (Cloudflare 5xx, "web server is
// returning an unknown error", rate-limit walls). Those come back as a few hundred characters
// with no real article in them -- skip so the pipeline doesn't waste a rewrite attempt on one.
const ERROR_PAGE_SIGNATURE =
  /cloudflare|web server is (returning|down)|error code \d{3}|attention required|access denied|are you a robot|enable javascript and cookies/i;
const MIN_ARTICLE_CHARS = 400;

/**
 * Fetch a single article's clean content. Returns null on failure (missing page, Firecrawl
 * error, an error/challenge page, too-thin content) rather than throwing, so callers can just
 * skip to the next candidate.
 * @param {string} url
 * @returns {Promise<{ title: string, bodyText: string, imageUrl: string | null, publishedAt: string | null } | null>}
 */
export async function scrapeArticle(url) {
  try {
    const doc = await firecrawl.scrape(url, { formats: ["markdown"], onlyMainContent: true });
    const bodyText = doc.markdown?.trim();
    if (!bodyText) return null;

    if (bodyText.length < MIN_ARTICLE_CHARS || ERROR_PAGE_SIGNATURE.test(bodyText.slice(0, 600))) {
      console.log(`[crawler] scrapeArticle: ${url} looks like an error/challenge page or stub — skipping`);
      return null;
    }

    const title = doc.metadata?.title?.trim() || doc.metadata?.ogTitle?.trim();
    if (!title) return null;

    const rawImageUrl = doc.metadata?.ogImage?.trim() || doc.images?.[0] || null;
    const imageUrl = rawImageUrl && !isGenericPlaceholderImage(rawImageUrl) ? rawImageUrl : null;

    return { title, bodyText, imageUrl, publishedAt: extractPublishedAt(doc.metadata) };
  } catch (err) {
    console.error(`[crawler] scrapeArticle failed for ${url}:`, getMessage(err));
    return null;
  }
}

/** @param {unknown} err @returns {string} */
function getMessage(err) {
  return err instanceof Error ? err.message : "Unknown error";
}
