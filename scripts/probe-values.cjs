const { Client } = require("pg");
(async () => {
  const c = await new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site?schema=public" });
  await c.connect();
  // 示波器相关产品（品牌分类 SIGLENT-OSCILLOSCOPE 子树）已录的参数值分布
  const defs = await c.query(`SELECT d.id, d.key, dt.name AS zh FROM "ParamDefinition" d LEFT JOIN "ParamDefinitionTranslation" dt ON dt."paramDefinitionId"=d.id AND dt.locale='zh' WHERE d."categoryId" IN (SELECT id FROM "Category" WHERE code IN ('SIGLENT-OSCILLOSCOPE')) OR d."categoryId" IN (SELECT id FROM "Category" WHERE "siteCategoryId" IN (SELECT id FROM "Category" WHERE code='OSCILLOSCOPE'))`);
  console.log("=== siglent oscope defs ===");
  for (const d of defs.rows) console.log(d.id, "|", d.key, "|", d.zh);
  // 这些 def 对应的产品值数量
  const valCount = await c.query(`SELECT v."paramDefinitionId", count(*) FROM "ProductParamValue" v WHERE v."paramDefinitionId" IN (SELECT d.id FROM "ParamDefinition" d) GROUP BY v."paramDefinitionId" ORDER BY count(*) DESC LIMIT 40`);
  const defById = new Map(defs.rows.map(r => [r.id, r]));
  console.log("\n=== value counts for all defs ===");
  for (const v of valCount.rows) {
    const d = defById.get(v.paramDefinitionId);
    console.log(v.count, "|", d ? d.key : v.paramDefinitionId);
  }
  // 看一个产品示例的全部参数值
  const sample = await c.query(`SELECT p.model FROM "Product" p WHERE p.model='SDS1104X-E' LIMIT 1`);
  if (sample.rows[0]) {
    const pv = await c.query(`SELECT d.key, dt.name AS zh, v."valueString" FROM "ProductParamValue" v JOIN "ParamDefinition" d ON d.id=v."paramDefinitionId" LEFT JOIN "ParamDefinitionTranslation" dt ON dt."paramDefinitionId"=d.id AND dt.locale='zh' WHERE v."productId"=(SELECT id FROM "Product" WHERE model='SDS1104X-E')`);
    console.log("\n=== SDS1104X-E params ===");
    for (const r of pv.rows) console.log(" ", r.key, "|", r.zh, "=", r.valueString);
  }
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
