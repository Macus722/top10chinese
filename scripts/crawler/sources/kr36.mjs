// 36kr.com (36氪) -- one of China's primary startup / venture / tech business news desks.
// Article URLs are https://36kr.com/p/<numeric id>, the id monotonically increasing with
// publish time, so a descending id sort is a reliable "newest first" without a date parse.
// Two section indexes are polled: 创投 (venture/capital) and 科技 (technology) -- the two that
// most consistently carry company / founder / Chinese-business-world stories that fit
// 全球十大华人's remit. The rewrite step's topic gate drops anything that slips through
// off-topic (product reviews, consumer how-tos, pure policy explainers).
//
// The listing exposes each link both as 36kr.com/p/<id> and www.36kr.com/p/<id>; both are
// normalized to the bare-host form here so the DB's unique source_url constraint (and the
// crawled_source_urls dedup view) treat them as one.
import { discoverArticleLinks, scrapeArticle } from "../firecrawl-client.mjs";

const LISTING_URLS = [
  "https://36kr.com/information/contact/", // 创投 (venture / capital)
  "https://36kr.com/information/technology/", // 科技 (technology)
];

const ARTICLE_URL_PATTERN = /^https?:\/\/(?:www\.)?36kr\.com\/p\/(\d+)(?:[/?#]|$)/i;

/** @param {string} url @returns {string | null} canonical https://36kr.com/p/<id>, or null */
function canonicalize(url) {
  const match = url.match(ARTICLE_URL_PATTERN);
  return match ? `https://36kr.com/p/${match[1]}` : null;
}

/** @type {import("../types.mjs").NewsSource} */
export const kr36Source = {
  id: "kr36",
  name: "36氪",

  async listRecent(limit) {
    const seen = new Set();
    for (const listingUrl of LISTING_URLS) {
      for (const link of await discoverArticleLinks(listingUrl)) {
        const canonical = canonicalize(link);
        if (canonical) seen.add(canonical);
      }
    }
    return [...seen]
      .sort((a, b) => {
        const idA = BigInt(a.match(/\/p\/(\d+)$/)[1]);
        const idB = BigInt(b.match(/\/p\/(\d+)$/)[1]);
        return idA > idB ? -1 : idA < idB ? 1 : 0;
      })
      .slice(0, limit);
  },

  async fetchArticle(sourceUrl) {
    return scrapeArticle(sourceUrl);
  },
};
