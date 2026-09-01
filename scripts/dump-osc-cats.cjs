const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  // 示波器产品挂载分类分布
  const r1 = await c.query(
    `SELECT c.id, c.code, count(p.id) AS products,
       (SELECT count(*) FROM "ParamDefinition" d WHERE d."categoryId"=c.id) AS defs
     FROM "Product" p
     LEFT JOIN "Category" c ON c.id = p."categoryId"
     LEFT JOIN "ProductLine" pl ON pl.id = p."productLineId"
     WHERE pl.code ILIKE '%SDS%'
     GROUP BY c.id, c.code ORDER BY products DESC`
  );
  console.log("--- 示波器产品分类分布 ---");
  r1.rows.forEach((x) => console.log(x.code, "| products=" + x.products, "| defs=" + x.defs, "| " + x.id));

  // 各子分类是否继承父分类 def？查 defs 归属
  const r2 = await c.query(
    `SELECT d."categoryId", c.code, count(*) AS defs FROM "ParamDefinition" d
     LEFT JOIN "Category" c ON c.id=d."categoryId"
     GROUP BY d."categoryId", c.code ORDER BY c.code`
  );
  console.log("--- 所有分类 defs 归属 ---");
  r2.rows.forEach((x) => console.log(x.code, "| defs=" + x.defs, "| " + x.categoryId));
  await c.end();
});
