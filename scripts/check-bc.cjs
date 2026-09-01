const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // SPECTRUM 全站品类
  const sp = await c.query(`SELECT id, code FROM "Category" WHERE code='SPECTRUM'`);
  const spid = sp.rows[0].id;
  console.log("SPECTRUM cat:", spid);
  // 指向它的品牌分类
  const bc = await c.query(
    `SELECT id, code, "parentId", "brandId" FROM "Category" WHERE "siteCategoryId"=$1`, [spid]
  );
  console.log("brand cats mapping to SPECTRUM:", bc.rows.length);
  bc.rows.forEach((r) => console.log("  ", r.id, r.code, "| parent=", r.parentId, "| brand=", r.brandId));
  // 这些分类的 freqRange defs 和值
  for (const r of bc.rows) {
    const defs = await c.query(`SELECT id, key FROM "ParamDefinition" WHERE "categoryId"=$1 AND key='freqRange'`, [r.id]);
    if (defs.rows.length === 0) continue;
    for (const d of defs.rows) {
      const vals = await c.query(`SELECT DISTINCT "valueString" FROM "ProductParamValue" WHERE "paramDefinitionId"=$1`, [d.id]);
      console.log(`  cat=${r.code} def=${d.id} values=${vals.rows.length}:`);
      vals.rows.slice(0, 20).forEach((v) => console.log("      ", JSON.stringify(v.valueString)));
    }
  }
  await c.end();
})();
