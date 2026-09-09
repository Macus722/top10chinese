// Entrypoint invoked directly by GitHub Actions (.github/workflows/crawl-article.yml), not an
// HTTP route -- the crawler runs as a plain script in a GitHub Actions job, same as the other
// MCN Group crawlers, inserting straight into the shared Supabase.

import { runCrawlCycle } from "./pipeline.mjs";

// `npm run crawl -- --dry-run` runs the full pipeline but stops before the DB insert.
const dryRun = process.argv.includes("--dry-run");

// mcn-singapore's equivalent (the API route handler) wraps runCrawlCycle() in a try/catch so an
// uncaught error (e.g. a transient Anthropic API failure -- rewrite.mjs's and safety-gate.mjs's
// anthropic.messages.create() calls aren't internally caught, unlike every other stage) still
// returns a clean result instead of an unhandled-exception stack trace. Re-created here since
// there's no route handler in this standalone-script version to provide that catch-all.
try {
  const result = await runCrawlCycle({ dryRun });
  console.log("[crawler] cycle result:", JSON.stringify(result, null, 2));

  // Fails the GitHub Actions run (non-zero exit) only for genuine failures -- "no-candidate"
  // (every source had nothing fresh this week) is an expected, non-error outcome and should not
  // turn the workflow red.
  if (result.status === "not-configured" || result.status === "rewrite-failed") {
    process.exit(1);
  }
} catch (error) {
  console.error("[crawler] cycle threw unexpectedly:", error instanceof Error ? error.message : error);
  process.exit(1);
}
