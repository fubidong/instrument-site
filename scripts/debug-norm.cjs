const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const slugNorm = (s) => (s || "").replace(/[^\x00-\x7f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')`);
  const dbModels = r.rows.map((x) => x.model);
  const normMap = new Map(dbModels.map((m) => [norm(m), m]));
  // 测试几个 slug
  const tests = ["sds6034-h10-pro", "sds6034-h12-pro", "sds5034x-hd", "sds5034x", "ssg5040x-v", "ssg5060x-v", "sds6054l-h10", "sdm3055"];
  tests.forEach((t) => {
    const exact = normMap.get(t);
    // 前缀匹配
    let prefix = null;
    for (const [n, m] of normMap) {
      if (t.startsWith(n + "-") || n.startsWith(t + "-")) { prefix = m; break; }
    }
    console.log(t, "-> exact:", exact || "-", "| prefix:", prefix || "-");
  });
  await c.end();
})();
