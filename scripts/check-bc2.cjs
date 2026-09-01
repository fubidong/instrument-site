const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const sp = await c.query(`SELECT id, code FROM "Category" WHERE code='SPECTRUM'`);
  const spid = sp.rows[0].id;
  // SPECTRUM children
  const ch = await c.query(`SELECT id, code FROM "Category" WHERE "parentId"=$1`, [spid]);
  console.log("SPECTRUM children:", ch.rows.length);
  ch.rows.forEach((r) => console.log("  child:", r.id, r.code));
  const ids = [spid, ...ch.rows.map((r) => r.id)];
  // 所有品牌分类 siteCategoryId ∈ ids
  const bc = await c.query(
    `SELECT id, code, "siteCategoryId", "brandId" FROM "Category" WHERE "siteCategoryId" = ANY($1) AND "brandId" IS NOT NULL`, [ids]
  );
  console.log("brand cats mapping to SPECTRUM or children:", bc.rows.length);
  bc.rows.forEach((r) => console.log("  ", r.code, "siteCat=", r.siteCategoryId, "brand=", r.brandId));
  // 这些分类的 freqRange defs + 值
  for (const r of bc.rows) {
    const defs = await c.query(`SELECT id, key FROM "ParamDefinition" WHERE "categoryId"=$1 AND key IN ('freqRange','maxFreq')`, [r.id]);
    for (const d of defs.rows) {
      const vals = await c.query(`SELECT DISTINCT "valueString" FROM "ProductParamValue" WHERE "paramDefinitionId"=$1`, [d.id]);
      console.log(`  ${r.code} ${d.key} (${d.id}) values=${vals.rows.length}:`);
      vals.rows.slice(0, 25).forEach((v) => console.log("     ", JSON.stringify(v.valueString)));
    }
  }
  await c.end();
})();
