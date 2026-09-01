const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const catId = (await c.query(`SELECT id FROM "Category" WHERE code='SIGLENT-OSCILLOSCOPE'`)).rows[0].id;
  // defs
  const defs = (await c.query(
    `SELECT d.id, d.key, d."isFilterable", d."isHighlight", g.code grp FROM "ParamDefinition" d
     LEFT JOIN "ParamGroup" g ON g.id=d."paramGroupId" WHERE d."categoryId"=$1 ORDER BY d."sortOrder"`, [catId]
  )).rows;
  // 每个 def 有值的产品数
  for (const d of defs) {
    const cnt = (await c.query(
      `SELECT COUNT(DISTINCT ppv."productId") n FROM "ProductParamValue" ppv WHERE ppv."paramDefinitionId"=$1`, [d.id]
    )).rows[0].n;
    console.log(d.key.padEnd(20), "f=" + d.isFilterable, "hl=" + d.isHighlight, "vals=" + cnt, d.grp || "");
  }
  await c.end();
})();
