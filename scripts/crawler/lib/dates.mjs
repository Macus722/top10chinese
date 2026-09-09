// "YYYY.MM.DD" -- the date format Top 10 Chinese's existing insight pages and the shared
// `articles.publish_date` column use (see mcn-database/schema.sql). 全球十大华人 is a
// Chinese-perspective publication with no single home market; Asia/Shanghai is the reference
// clock, same choice as World Best 500.
export function todayCN() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}
