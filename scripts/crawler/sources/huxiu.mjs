// huxiu.com (虎嗅) -- Chinese business + tech commentary and company analysis. Article URLs are
// https://www.huxiu.com/article/<numeric id>.html, the id increasing with publish time, so a
// descending id sort gives "newest first" without a date parse. The homepage is the listing.
//
// huxiu leans more macro/commentary than 36kr's straight news; it is the second source, tried
// after 36kr, and the rewrite step's topic gate is what keeps only the company / founder /
// Chinese-business pieces that fit 全球十大华人.
import { discoverArticleLinks, scrapeArticle } from "../firecrawl-client.mjs";

const LISTING_URL = "https://www.huxiu.com/";

const ARTICLE_URL_PATTERN = /^https?:\/\/(?:www\.)?huxiu\.com\/article\/(\d+)\.html/i;

/** @param {string} url @returns {string | null} canonical URL, or null if not an article */
function canonicalize(url) {
  const match = url.match(ARTICLE_URL_PATTERN);
  return match ? `https://www.huxiu.com/article/${match[1]}.html` : null;
}

/** @type {import("../types.mjs").NewsSource} */
export const huxiuSource = {
  id: "huxiu",
  name: "虎嗅",

  async listRecent(limit) {
    const seen = new Set();
    for (const link of await discoverArticleLinks(LISTING_URL)) {
      const canonical = canonicalize(link);
      if (canonical) seen.add(canonical);
    }
    return [...seen]
      .sort((a, b) => {
        const idA = BigInt(a.match(/\/article\/(\d+)\.html$/)[1]);
        const idB = BigInt(b.match(/\/article\/(\d+)\.html$/)[1]);
        return idA > idB ? -1 : idA < idB ? 1 : 0;
      })
      .slice(0, limit);
  },

  async fetchArticle(sourceUrl) {
    return scrapeArticle(sourceUrl);
  },
};
