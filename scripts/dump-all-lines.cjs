// 盘点：各品牌分类 系列/产品数 + 每个可筛选/重要 def 的值覆盖率
const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const r = await c.query(
    `SELECT c.code AS cat, pl.code AS line, count(p.id) AS products
     FROM "Category" c
     LEFT JOIN "ProductLine" pl ON pl."categoryId"=c.id
     LEFT JOIN "Product" p ON p."productLineId"=pl.id AND p."isActive"=true
     WHERE c."brandId"='2235b359-3d5c-4dcc-b763-3ea81273fd22'
     GROUP BY c.code, pl.code
     ORDER BY c.code, products DESC`
  );
  let cur = "";
  for (const row of r.rows) {
    if (row.cat !== cur) { console.log("\n=== " + row.cat + " ==="); cur = row.cat; }
    console.log("  " + row.line.padEnd(22) + "products=" + row.products);
  }
  await c.end();
});
