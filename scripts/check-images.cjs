const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT "productId", COUNT(*)::int AS n FROM "ProductImage" GROUP BY "productId" ORDER BY n DESC LIMIT 10`);
  console.log("每产品图片数TOP:", JSON.stringify(r.rows));
  const tot = await c.query(`SELECT COUNT(*)::int AS t FROM "ProductImage"`);
  console.log("总图片数:", tot.rows[0].t);
  const p = await c.query(`SELECT COUNT(*)::int AS t FROM "Product"`);
  console.log("总产品数:", p.rows[0].t);
  const noimg = await c.query(`SELECT COUNT(*)::int AS t FROM "Product" WHERE "coverImage" IS NULL`);
  console.log("无封面产品:", noimg.rows[0].t);
  const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='ProductImage' ORDER BY ordinal_position`);
  console.log("ProductImage列:", cols.rows.map((r) => r.column_name).join(","));
  // 抽样看一条图片数据
  const s = await c.query(`SELECT * FROM "ProductImage" LIMIT 3`);
  console.log("样例:", JSON.stringify(s.rows).slice(0, 800));
  await c.end();
})();
