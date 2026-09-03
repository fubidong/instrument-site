const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 鼎阳产品按分类分布
  const r = await c.query(`
    SELECT p."categoryId", tr.name, COUNT(*)::int AS n
    FROM "Product" p
    LEFT JOIN "CategoryTranslation" tr ON tr."categoryId"=p."categoryId" AND tr.locale='zh'
    JOIN "ProductLine" pl ON pl.id=p."productLineId"
    JOIN "Brand" b ON b.id=pl."brandId"
    WHERE b.code='SIGLENT'
    GROUP BY p."categoryId", tr.name
    ORDER BY n DESC`);
  console.log("鼎阳产品分类分布:");
  r.rows.forEach((x) => console.log("  ", x.categoryId, x.name, "->", x.n, "个"));
  await c.end();
})();
