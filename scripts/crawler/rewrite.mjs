// Rewrites a scraped 36氪 / 虎嗅 story into a full GEO/SEO-structured 全球十大华人 深度观察 piece
// (Simplified Chinese), then separately generates its SEO metadata. Two-Claude-call shape (a
// single combined call occasionally drops the SEO fields on a JSON hiccup). 全球十大华人's
// editorial voice is drawn from the site's own hand-written insight pages: an authoritative,
// third-party 商业研究院 register -- analysis, never promotion.
//
// Topic gate: 36氪 / 虎嗅 also carry consumer product reviews, how-tos, pure policy explainers,
// and stories about non-Chinese companies with no 华人 angle. The model classifies the source
// first -- if it is not substantively about a Chinese company, a Chinese founder / business
// leader, or a development that materially shapes the Chinese / Chinese-diaspora business world,
// it returns { onTopic: false } and rewriteArticleContent() resolves to { offTopic: true },
// which the pipeline treats as "try the next candidate", not a failure.
//
// Slug handling: slugify() strips everything outside [a-z0-9\s-]; a Chinese title would collapse
// to nothing. The model returns a separate `slugSeed` (English / pinyin words) to slugify.
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";

const REWRITE_MODEL = "claude-sonnet-4-6";
const METADATA_MODEL = "claude-haiku-4-5-20251001";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("Warning: ANTHROPIC_API_KEY is not set. The article crawler will not work.");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

// Closed set of real internal links the rewrite may choose from -- the model picks up to 2, it
// never invents a URL. Relative hrefs: insight.html sits at the site root, same level as these.
const ALLOWED_INTERNAL_LINKS = [
  { label: "历届荣誉", href: "honorees.html" },
  { label: "深度洞察", href: "insights.html" },
  { label: "企业认证", href: "enterprise-certification.html" },
];

/** @param {string} text @returns {string} */
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced ? fenced[1] : text).trim();
}

/**
 * ASCII-only slug from the model's `slugSeed` field (English / pinyin words), not the Chinese
 * title. Falls back to a random suffix if the seed collapses to nothing -- articles.slug is
 * `unique` in the DB (mcn-database/schema.sql), so an empty string here would silently succeed
 * once and then fail every subsequent insert with the same empty slug, reported only as an
 * opaque "rewrite-failed" status with no obvious cause.
 */
export function slugify(seed) {
  const slug = seed
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join("-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return slug || `article-${randomUUID().slice(0, 8)}`;
}

const EDITORIAL_SYSTEM_PROMPT = `## 角色

你是「全球十大华人商业研究院」的资深编辑。全球十大华人是一家以中文视角、独立记录与评析全球华人商业力量的媒体与评选机构，关注具有全球影响力的华人企业家、商业领袖与卓越企业。我们看重的是长期价值、产业地位、跨境经营能力与治理水平——不是短期股价、名人八卦，也不是励志故事。

你同时熟悉 2025-2026 年针对 Google 搜索、Google AI 摘要、ChatGPT 与 Perplexity 的 SEO 与 GEO（生成式引擎优化）实务。

## 第一步：判断主题是否合适

你会收到一篇来自中国商业科技媒体（36氪或虎嗅）的中文报道。这些媒体也刊登不适合本刊的内容：消费品评测、使用教程、纯政策解读，以及与华人商业世界无关的外国公司报道。

先判断：这篇来源是否「实质上」关于以下之一？
- 一家华人创办或华人主导的企业（中国大陆、香港、台湾、新加坡、马来西亚及其他华人商业圈）
- 一位华人企业创始人或商业领袖
- 一项对华人 / 华语商业世界的产业格局、资本流向或竞争态势具有实质影响的动态

- 若「否」：只返回 {"onTopic": false, "offTopicReason": "一句话说明这篇为何不适合全球十大华人"}，不要返回其他任何字段。
- 若「是」：进行第二步，返回完整文章 JSON（"onTopic" 字段设为 true）。

## 第二步：改写为全球十大华人的深度观察

不要轻度改写或转述原文。以来源作为事实起点，写一篇原创的、结构化的中文分析报道，从全球十大华人的视角切入：这家企业／这位领袖在华人商业世界中的位置、其商业模式或战略的结构性特征、对理解当前华人产业格局与资本动向有何参照意义。

## 编辑立场（不可妥协）

全球十大华人独立于所有被报道与被评选的企业。编辑部的角色是描述与分析，不是替任何企业或个人背书或宣传。

- 全文维持第三方分析语气，绝非被报道对象的发言人或传记作者。
- 提及公司或人名属于报道行为，不代表背书。
- 每一项事实陈述都必须可归因于来源报道、公开可查证的一般知识，或已确立的产业常识。若某个数字、职位、时间或事件无法从所给素材中找到根据，改以概括方式描述即可，绝不捏造数字、头衔、引言或具名文件。
- 关键：各段落的深度应依来源素材实际能支撑的程度调整。内容较短但完全有据可查是正确的做法；为了凑字数而填入泛泛的商业评论或励志话术则不可接受。

## 语言规范

- 使用简体中文。华人企业与人物直接使用其通用中文名；涉及的外国公司、机构或人物，首次出现时给出中文译名并在括号内附英文原名（例如「英伟达（Nvidia）」）。
- 字数：若来源素材确实支撑得起，以 1,200-1,800 字为目标；否则写一篇较短但完整的报道，绝不硬凑字数。
- 语气：客观、说明性、面向商业读者。不使用夸饰语、励志语或「传奇」「奇迹」「白手起家」之类的词。
- 小标题一律为陈述句，绝非疑问句（FAQ 区块除外）。

## 必要结构

H1（"title" 字段）：包含焦点关键词，置于句中或句尾。描述文章确立了什么，而非制造悬念。参考格式：「〔企业／人物〕——〔其战略或产业地位的核心特征〕」。

引言（"standfirst" 字段，1-2 句）：总结文章的结论。这是 AI 引擎最可能直接引用作为答案的部分，必须不依赖正文也能独立成立。

开篇段落（"sections" 的第一项，标题应读起来像切入点，而非字面上的「简介」）——从这家企业／这位领袖当前在华人商业世界中的位置切入，不要从出生年份或早年经历切入。在前两句话中带入焦点关键词。

接着依来源素材实际支撑的程度，从以下方向中挑选 2-4 个 H2 段落（若某个方向会迫使你捏造事实，就略过）：
- 竞争力或产业地位的来源：营收结构、技术或标准的掌控力、市场份额，需标明出处
- 商业模式或战略的结构性特征：这门生意或这套打法为何能持续
- 在华人产业格局中的参照意义：对理解行业演变、资本流向或竞争态势有何提示
- 接下来值得观察的变量：尚待确认或即将发生的变化，清楚区分「已确认」与「预期」

FAQ（"faqItems"，4-8 组问答，依素材实际能回答的程度调整数量）：
- 问题以商业读者实际会在搜索引擎输入的方式呈现
- 每个答案 60-120 字，必须自成一体——不可出现「如上所述」之类的指涉语
- 每个答案的第一句必须是完整、可直接引用的陈述

表格（"table"，选填——仅在素材中确实存在 3 个以上可比较的变量时才附上，否则完全省略，不可硬凑）。

结尾（"sections" 的最后一项，读起来应像结论）：3-4 句。以报道语气重申文章的核心发现。带入焦点关键词一次。不含任何行动呼吁或销售语言。

## SEO 规则

- 焦点关键词须出现于：H1、引言、开篇前两句、至少两个 H2 小标题、FAQ 区块、结尾
- 关键词密度约 0.8%-1.5%。同一句中不得出现两次，连续句子中也不得重复出现
- 不得有两个 H2 以相同的词或句式开头

## GEO 规则

- 每个段落皆采倒金字塔写法：先给核心论点，再展开说明
- 明确陈述事实；若确实存在不确定性，明确点出限制所在，而非模糊带过
- 每个外部事实陈述都应归因于来源报道或可具名的一般知识
- 行业术语第一次出现时以一个子句定义清楚，让段落被单独引用时仍能理解

## 禁止事项

- 以疑问句作为 H2 小标题（FAQ 除外）
- 对被报道的企业或个人使用第一人称或传记体
- 没有数据佐证的最高级用语——「全球第一」「最成功」「无可争议的领导者」
- 捏造的统计数据、虚构的引言、头衔，或未标明出处的数字
- 励志话术、「白手起家」「改变世界」之类的叙事框架
- 空泛的开场白，例如「在瞬息万变的商业世界中……」
- 连续使用相同的小标题句式

## 输出格式

只返回一个合法的 JSON 对象，不含任何额外文字，不含 markdown code fence。字符串值内部一律使用中文引号「」或『』，绝不使用英文双引号 " ——若必须引用英文原文，也改用中文引号包裹。字符串内不得出现未转义的换行。

主题不合适时，只返回：
{"onTopic": false, "offTopicReason": "一句话说明"}

主题合适时，返回：
{
  "onTopic": true,
  "title": "依上方格式指南撰写的 H1（简体中文）",
  "slugSeed": "3-6 个英文或拼音单词，全小写、以空格分隔，通常就是企业或人物的英文/拼音名 + 关键词（例如 'byd-overseas-factory-strategy'）",
  "standfirst": "1-2 句引言（简体中文）",
  "focusKeyphrase": "全文使用的焦点关键词（简体中文）",
  "sections": [
    { "heading": "陈述句 H2（简体中文）", "paragraphs": ["段落一", "段落二"] }
  ],
  "faqItems": [
    { "question": "商业读者搜索语气的问题", "answer": "60-120 字、自成一体的答案" }
  ],
  "table": { "headers": ["列1", "列2"], "rows": [["a", "b"]] } | null,
  "imageAlt": "以英文撰写，描述本文适合搭配的封面照片／插图的一句话",
  "internalLinkLabels": ["从下方允许清单中选出最多 2 个标签，依相关程度排序，逐字照抄"]
}

允许的内部链接（逐字选出，最多 2 个）：
{{INTERNAL_LINK_OPTIONS}}`;

/** @param {unknown} value */
function parseSections(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const heading = typeof item?.heading === "string" ? item.heading.trim() : "";
      const paragraphs = Array.isArray(item?.paragraphs)
        ? item.paragraphs.filter((p) => typeof p === "string" && p.trim().length > 0)
        : [];
      return heading && paragraphs.length > 0 ? { heading, paragraphs } : null;
    })
    .filter((section) => section !== null);
}

/** @param {unknown} value */
function parseFaqItems(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const question = typeof item?.question === "string" ? item.question.trim() : "";
      const answer = typeof item?.answer === "string" ? item.answer.trim() : "";
      return question && answer ? { question, answer } : null;
    })
    .filter((item) => item !== null);
}

/** @param {unknown} value */
function parseTable(value) {
  if (typeof value !== "object" || value === null) return undefined;
  const headers = Array.isArray(value.headers) ? value.headers.filter((h) => typeof h === "string") : [];
  if (headers.length === 0 || !Array.isArray(value.rows)) return undefined;
  const rows = value.rows
    .map((row) => (Array.isArray(row) ? row.filter((c) => typeof c === "string") : null))
    .filter((row) => row !== null && row.length > 0);
  return rows.length > 0 ? { headers, rows } : undefined;
}

// One rewrite request + JSON parse. Returns the parsed object, or null on a bad/absent/
// unparseable response so the caller can retry once (the model occasionally emits a stray
// unescaped quote mid-string, which is transient).
async function requestRewrite(systemPrompt, userMessage) {
  const message = await anthropic.messages.create({
    model: REWRITE_MODEL,
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const textBlock = message.content.find((block) => block.type === "text");
  const raw = textBlock?.text?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(extractJson(raw));
  } catch (err) {
    console.error("[crawler] rewriteArticleContent: failed to parse JSON:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Rewrites a scraped source article into the full editorial-template structure.
 * @param {string} sourceTitle
 * @param {string} sourceBody
 * @returns {Promise<
 *   | { offTopic: true, reason: string }
 *   | { title: string, slug: string, standfirst: string, focusKeyphrase: string, sections: {heading: string, paragraphs: string[]}[], faqItems: {question: string, answer: string}[], table: {headers: string[], rows: string[][]} | undefined, imageAlt: string, internalLinks: {label: string, href: string}[], fullText: string[] }
 *   | null
 * >}
 */
export async function rewriteArticleContent(sourceTitle, sourceBody) {
  const linkOptions = ALLOWED_INTERNAL_LINKS.map((l) => `- "${l.label}" (${l.href})`).join("\n");
  const systemPrompt = EDITORIAL_SYSTEM_PROMPT.replace("{{INTERNAL_LINK_OPTIONS}}", linkOptions);

  const userMessage = `来源报道标题：「${sourceTitle}」\n\n来源报道内容：\n${sourceBody.slice(0, 7000)}`;

  let parsed = await requestRewrite(systemPrompt, userMessage);
  if (!parsed) {
    console.log("[crawler] rewrite: retrying once after unparseable response");
    parsed = await requestRewrite(systemPrompt, userMessage);
  }
  if (!parsed) return null;

  if (parsed.onTopic === false) {
    const reason =
      typeof parsed.offTopicReason === "string" ? parsed.offTopicReason.trim() : "not about the Chinese business world";
    return { offTopic: true, reason };
  }

  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  const slugSeed = typeof parsed.slugSeed === "string" ? parsed.slugSeed.trim() : "";
  const standfirst = typeof parsed.standfirst === "string" ? parsed.standfirst.trim() : "";
  const focusKeyphrase = typeof parsed.focusKeyphrase === "string" ? parsed.focusKeyphrase.trim() : "";
  const sections = parseSections(parsed.sections);
  const faqItems = parseFaqItems(parsed.faqItems);
  const table = parseTable(parsed.table);
  const imageAlt = typeof parsed.imageAlt === "string" ? parsed.imageAlt.trim() : "";
  const labels = Array.isArray(parsed.internalLinkLabels)
    ? parsed.internalLinkLabels.filter((l) => typeof l === "string")
    : [];

  if (!title || !slugSeed || sections.length === 0 || !imageAlt) return null;

  const internalLinks = labels
    .map((label) => ALLOWED_INTERNAL_LINKS.find((l) => l.label === label))
    .filter((l) => Boolean(l))
    .slice(0, 2);

  const fullText = [
    standfirst,
    ...sections.flatMap((s) => s.paragraphs),
    ...faqItems.flatMap((f) => [f.question, f.answer]),
  ].filter(Boolean);

  return {
    title,
    slug: slugify(slugSeed),
    standfirst,
    focusKeyphrase,
    sections,
    faqItems,
    table,
    imageAlt,
    // Falls back to the full allowed set if the model didn't return valid labels -- never
    // ships with zero internal links.
    internalLinks: internalLinks.length > 0 ? internalLinks : ALLOWED_INTERNAL_LINKS,
    fullText,
  };
}

// Same "retry a small, cheap call a few times" convention as Singapore's rewrite.ts -- SEO
// metadata is required (safety-gate.mjs holds the article rather than publish without it), so a
// transient single-call failure here must not silently ship without it.
const SEO_METADATA_ATTEMPTS = 3;

/**
 * @param {string} title
 * @param {string} focusKeyphrase
 * @param {string[]} fullText
 */
async function generateSeoMetadataOnce(title, focusKeyphrase, fullText) {
  const plainBody = fullText.join(" ").slice(0, 2000);

  const message = await anthropic.messages.create({
    model: METADATA_MODEL,
    max_tokens: 512,
    system: `你是一位 SEO 编辑。根据文章标题、焦点关键词与内文，生成 metadata。全部使用简体中文。

规则：
- metaTitle：最多 30 个中文字，焦点关键词尽量靠前，吸引点击但不夸大
- metaDescription：70-80 个中文字，包含焦点关键词，以明确的信息价值作结
- excerpt：一句话摘要（最多 80 个中文字），用于首页／列表卡片，写给真人读者看，语气比 metaDescription 更自然

只返回一个合法的 JSON 对象，不含任何额外文字：
{"metaTitle": "...", "metaDescription": "...", "excerpt": "..."}`,
    messages: [
      {
        role: "user",
        content: `标题：「${title}」\n焦点关键词：「${focusKeyphrase}」\n\n内文：\n${plainBody}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const raw = textBlock?.text?.trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(extractJson(raw));
    const metaTitle = typeof parsed.metaTitle === "string" ? parsed.metaTitle.trim() : "";
    const metaDescription = typeof parsed.metaDescription === "string" ? parsed.metaDescription.trim() : "";
    const excerpt = typeof parsed.excerpt === "string" ? parsed.excerpt.trim() : "";
    if (!metaTitle || !metaDescription || !excerpt) return null;
    return { metaTitle, metaDescription, excerpt };
  } catch (err) {
    console.error("[crawler] generateSeoMetadata: failed to parse JSON:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Generates SEO metadata with retries. Returns null (never a partially-empty object) if every
 * attempt fails -- the caller must treat null as a hold condition, not fall back to placeholder
 * text.
 * @param {string} title
 * @param {string} focusKeyphrase
 * @param {string[]} fullText
 */
export async function generateSeoMetadataWithRetry(title, focusKeyphrase, fullText) {
  for (let attempt = 1; attempt <= SEO_METADATA_ATTEMPTS; attempt++) {
    try {
      const result = await generateSeoMetadataOnce(title, focusKeyphrase, fullText);
      if (result) return result;
    } catch (err) {
      console.error(
        `[crawler] generateSeoMetadata attempt ${attempt}/${SEO_METADATA_ATTEMPTS} failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  return null;
}
