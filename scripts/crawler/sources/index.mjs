// Registry of configured sources, tried in order by the weekly pipeline (see ../pipeline.mjs)
// until one yields a fresh candidate the rewrite step accepts as on-topic (a notable Chinese
// company, founder, or business-world development worth a 全球十大华人 深度观察 piece).
//
// fortunechina.com -- the site Top 10 Chinese asked to mirror -- does not crawl: no sitemap or
// RSS, JS-heavy, and scrape(links) only ever returns its persistent nav. 36氪 + 虎嗅 cover the
// same Chinese-business subject matter and both crawl cleanly.
import { kr36Source } from "./kr36.mjs";
import { huxiuSource } from "./huxiu.mjs";

export const SOURCES = [kr36Source, huxiuSource];
