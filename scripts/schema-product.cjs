const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='Product' ORDER BY ordinal_position`);
  r.rows.forEach((x) => console.log(x.column_name.padEnd(22), x.data_type));
  console.log("\n-- 已有图片的产品数 --");
  const img = await c.query(`SELECT COUNT(*) n FROM "Product" WHERE "imageUrl" IS NOT NULL AND "imageUrl"<>''`);
  console.log("imageUrl 非空:", img.rows[0].n);
  const all = await c.query(`SELECT COUNT(*) n FROM "Product"`);
  console.log("总产品:", all.rows[0].n);
  // 抽查几个有图/无图的
  const ex = await c.query(`SELECT model, "imageUrl" FROM "Product" WHERE "imageUrl" IS NOT NULL AND "imageUrl"<>'' LIMIT 5`);
  ex.rows.forEach((x) => console.log("  有图:", x.model, "|", String(x.imageUrl).slice(0, 80)));
  await c.end();
})();
