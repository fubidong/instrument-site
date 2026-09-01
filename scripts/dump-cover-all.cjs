const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 每个品牌品类：产品数 / def 数 / 有值 def 数 / 平均每产品有值数
  const r = await c.query(`
    SELECT cc.code AS cat,
      (SELECT COUNT(*) FROM "Product" p LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId" WHERE pl."categoryId"=cc.id) AS prods,
      (SELECT COUNT(*) FROM "ParamDefinition" d WHERE d."categoryId"=cc.id) AS defs,
      (SELECT COUNT(*) FROM "ParamDefinition" d WHERE d."categoryId"=cc.id AND EXISTS (
         SELECT 1 FROM "ProductParamValue" v JOIN "Product" p ON p.id=v."productId" LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
         WHERE v."paramDefinitionId"=d.id AND pl."categoryId"=cc.id)) AS filled_defs
    FROM "Category" cc WHERE cc."brandId" IS NOT NULL ORDER BY cc."sortOrder"
  `);
  r.rows.forEach((x) => console.log(x.cat.padEnd(26), "产品:" + String(x.prods).padEnd(4), "def:" + String(x.defs).padEnd(4), "有值def:" + String(x.filled_defs).padEnd(4)));
  await c.end();
})();
