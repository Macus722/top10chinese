/* Data layer for the auto-crawled 深度观察 articles (the "每周自动洞察" strip on insights.html
   and the insight.html detail page). Reads the shared MCN Group Supabase project
   (public_articles view, country_code = T10C -- rows written by scripts/crawler/). These are
   SEPARATE from the 37 hand-written pages in assets/js/insights-data.js, which stay exactly as
   they are. Never throws: a Supabase outage just yields an empty list and the strip stays hidden.

   Depends on assets/js/supabase-config.js and the Supabase JS UMD build, both loaded first.
   Mirrors worldbest50-website/js/dossiers-client.js. */
window.T10C_INSIGHTS_CLIENT = (function () {
  var SOURCE_LABELS = { kr36: "36氪", huxiu: "虎嗅" };
  var CHARS_PER_MINUTE = 550; // Chinese reading speed; body is a flat array of paragraph strings

  function readTime(paragraphs) {
    var chars = paragraphs.join("").replace(/\s+/g, "").length;
    return Math.max(1, Math.round(chars / CHARS_PER_MINUTE)) + " 分钟阅读";
  }

  function strArr(v) {
    return Array.isArray(v) ? v.filter(function (x) { return typeof x === "string"; }) : [];
  }

  function sections(v) {
    if (!Array.isArray(v)) return [];
    return v.map(function (s) {
      return {
        heading: s && typeof s.heading === "string" ? s.heading.trim() : "",
        paragraphs: strArr(s && s.paragraphs).map(function (p) { return p.trim(); }).filter(Boolean)
      };
    }).filter(function (s) { return s.heading && s.paragraphs.length; });
  }

  function faq(v) {
    if (!Array.isArray(v)) return [];
    return v.map(function (f) {
      return {
        question: f && typeof f.question === "string" ? f.question.trim() : "",
        answer: f && typeof f.answer === "string" ? f.answer.trim() : ""
      };
    }).filter(function (f) { return f.question && f.answer; });
  }

  function table(v) {
    if (!v || typeof v !== "object") return null;
    var headers = strArr(v.headers);
    var rows = Array.isArray(v.rows) ? v.rows.map(strArr).filter(function (r) { return r.length; }) : [];
    return headers.length && rows.length ? { headers: headers, rows: rows } : null;
  }

  function links(v) {
    if (!Array.isArray(v)) return [];
    return v.map(function (l) {
      return {
        label: l && typeof l.label === "string" ? l.label.trim() : "",
        href: l && typeof l.href === "string" ? l.href.trim() : ""
      };
    }).filter(function (l) { return l.label && l.href; });
  }

  function fromDb(row) {
    var body = strArr(row.body);
    var secs = sections(row.sections);
    var reading = secs.length
      ? secs.reduce(function (a, s) { return a.concat(s.paragraphs); }, [])
      : body;
    return {
      slug: String(row.slug || ""),
      category: row.category || "深度观察",
      title: row.title || "",
      excerpt: row.excerpt || row.meta_description || "",
      metaTitle: row.meta_title || row.title || "",
      metaDescription: row.meta_description || row.excerpt || "",
      date: String(row.publish_date || "").replace(/-/g, "."),
      readTime: readTime(reading),
      standfirst: typeof row.standfirst === "string" ? row.standfirst.trim() : "",
      body: body,
      sections: secs,
      faqItems: faq(row.faq_items),
      table: table(row.article_table),
      internalLinks: links(row.internal_links),
      imageUrl: row.image_url || null,
      imageAlt: row.image_alt || row.title || "",
      sourceUrl: row.source_url || null,
      sourceName: SOURCE_LABELS[row.source] || null
    };
  }

  function configured() {
    return !!(window.T10C_SUPABASE_URL && window.T10C_SUPABASE_ANON_KEY &&
      window.T10C_SUPABASE_URL.indexOf("YOUR-PROJECT") === -1);
  }

  function client() {
    if (!window.supabase || !configured()) return null;
    if (!window.__t10cSupabase) {
      window.__t10cSupabase = window.supabase.createClient(window.T10C_SUPABASE_URL, window.T10C_SUPABASE_ANON_KEY);
    }
    return window.__t10cSupabase;
  }

  function siteCode() { return window.T10C_SITE_CODE || "T10C"; }

  function fetchAll() {
    var c = client();
    if (!c) return Promise.resolve([]);
    return c.from("public_articles").select("*").eq("country_code", siteCode())
      .order("created_at", { ascending: false }).limit(60)
      .then(function (r) {
        if (r.error) { console.error("Auto insights load failed:", r.error); return []; }
        return (r.data || []).map(fromDb);
      })
      .catch(function (e) { console.error("Auto insights load failed:", e); return []; });
  }

  function fetchOne(slug) {
    var c = client();
    if (!c || !slug) return Promise.resolve(null);
    return c.from("public_articles").select("*").eq("country_code", siteCode()).eq("slug", slug).maybeSingle()
      .then(function (r) { return r.error || !r.data ? null : fromDb(r.data); })
      .catch(function (e) { console.error("Auto insight load failed:", e); return null; });
  }

  return { fetchAll: fetchAll, fetchOne: fetchOne };
})();
