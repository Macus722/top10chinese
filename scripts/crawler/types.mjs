// Pure JSDoc typedef file (no runtime code) -- documents the shared shape every source adapter
// implements, mirrored from mcn-singapore's src/lib/crawler/types.ts. Kept as .mjs so editors
// resolve the `import("../types.mjs").NewsSource` JSDoc references used across sources/*.mjs.

/**
 * @typedef {Object} FetchedArticle
 * @property {string} title
 * @property {string} bodyText - clean markdown from Firecrawl
 * @property {string | null} imageUrl
 * @property {string | null} publishedAt - ISO 8601 publish timestamp from the source page's
 *   metadata, or null if the page exposes no parseable date
 */

/**
 * @typedef {Object} NewsSource
 * @property {string} id - 'successstory' -- stored in articles.source for admin visibility.
 * @property {string} name
 * @property {(limit: number) => Promise<string[]>} listRecent - newest-first article URLs
 * @property {(sourceUrl: string) => Promise<FetchedArticle | null>} fetchArticle
 */

export {};
