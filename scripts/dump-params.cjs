const { Client } = require("pg");
(async () => {
  const c = await new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site?schema=public" });
  await c.connect();
  const cats = await c.query(`SELECT id, code, "brandId", "parentId" FROM "Category" WHERE "brandId" IS NOT NULL ORDER BY "parentId" NULLS FIRST, code`);
  const groups = await c.query(`SELECT g.id, g.code, g."categoryId", g."sortOrder", gt.name AS zh FROM "ParamGroup" g LEFT JOIN "ParamGroupTranslation" gt ON gt."paramGroupId"=g.id AND gt.locale='zh'`);
  const defs = await c.query(`SELECT d.id, d."key", d.type, d.unit, d."paramGroupId", d."sortOrder", d."isHighlight", d."isFilterable", d."isComparable", dt.name AS zh FROM "ParamDefinition" d LEFT JOIN "ParamDefinitionTranslation" dt ON dt."paramDefinitionId"=d.id AND dt.locale='zh' ORDER BY d."sortOrder"`);
  const catOf = new Map(cats.rows.map(r => [r.id, r]));
  console.log("=== PARAM GROUPS ===");
  for (const g of groups.rows) {
    const ct = catOf.get(g.categoryId);
    console.log(g.id, "|", g.code, "|", g.zh, "| cat:", ct ? `${ct.code}${ct.brandId?'[BRAND]':''}` : g.categoryId);
  }
  console.log("\n=== DEFS PER GROUP ===");
  const byG = {};
  for (const d of defs.rows) (byG[d.paramGroupId] ??= []).push(d);
  for (const g of groups.rows) {
    const ds = byG[g.id] ?? [];
    console.log(`\n## ${g.code} (${ds.length} defs)`);
    for (const d of ds) console.log(`   ${d.key} | ${d.zh} | ${d.type} | unit=${d.unit ?? '-'} | imp=${d.isHighlight} filt=${d.isFilterable} cmp=${d.isComparable}`);
  }
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
