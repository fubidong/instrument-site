const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  // 鼎阳所有非示波器系列挂载
  const r = await c.query(
    `SELECT pl.code, c.code AS cat, c."parentId" AS parent, count(p.id) AS products
     FROM "ProductLine" pl
     LEFT JOIN "Category" c ON c.id = pl."categoryId"
     LEFT JOIN "Product" p ON p."productLineId" = pl.id
     WHERE c."brandId" = '2235b359-3d5c-4dcc-b763-3ea81273fd22'
       AND c.code NOT ILIKE '%OSC%'
     GROUP BY pl.code, c.code, c."parentId" ORDER BY c.code, pl.code`
  );
  r.rows.forEach((x) => console.log(x.cat.padEnd(24), x.code.padEnd(18), "products=" + x.products, "parent=" + x.parent));
  await c.end();
});
