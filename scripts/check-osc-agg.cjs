const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 综合站 OSCILLOSCOPE (6e48b858) 聚合范围：找所有 siteCategoryId=6e48b858 的品牌分类 + 其子分类
  const r = await c.query(`
    WITH osc_cats AS (
      SELECT cc.id FROM "Category" cc
      WHERE cc."siteCategoryId"='6e48b858-3a18-4bd3-a645-70ad3067e568'
      UNION
      SELECT cc2.id FROM "Category" cc2
      JOIN "Category" ccp ON ccp.id=cc2."parentId"
      WHERE ccp."siteCategoryId"='6e48b858-3a18-4bd3-a645-70ad3067e568'
    )
    SELECT pl.code AS line, COUNT(p.id) n FROM "Product" p
    LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
    WHERE pl."categoryId" IN (SELECT id FROM osc_cats)
    GROUP BY pl.code ORDER BY pl.code
  `);
  r.rows.forEach((x) => console.log(x.line.padEnd(22), x.n));
  // 哪些示波器产品不在聚合内
  const all = await c.query(`
    SELECT p.model, pl.code AS line FROM "Product" p
    LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
    WHERE pl."categoryId" IN (SELECT id FROM "Category" WHERE code IN ('SIGLENT-HI-RES-OSC','SIGLENT-DIGITAL-OSC','SIGLENT-HANDHELD-OSC','SIGLENT-COMPACT-OSC'))
    AND p.id NOT IN (
      SELECT p2.id FROM "Product" p2
      LEFT JOIN "ProductLine" pl2 ON pl2.id=p2."productLineId"
      WHERE pl2."categoryId" IN (
        SELECT cc.id FROM "Category" cc WHERE cc."siteCategoryId"='6e48b858-3a18-4bd3-a645-70ad3067e568'
        UNION SELECT cc3.id FROM "Category" cc3 JOIN "Category" ccp ON ccp.id=cc3."parentId" WHERE ccp."siteCategoryId"='6e48b858-3a18-4bd3-a645-70ad3067e568'
      )
    )
  `);
  console.log("\n不在 OSCILLOSCOPE 聚合内的示波器:");
  all.rows.forEach((x) => console.log("  ", x.model.padEnd(16), x.line));
  await c.end();
})();
