const { Client } = require("pg");
const fs = require("fs");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // SDL1020X 的所有图（cover + ProductImage）
  const cover = await c.query(`SELECT "coverImage" FROM "Product" WHERE model='SDL1020X'`);
  const imgs = await c.query(`SELECT pi."imagePath", pi."sortOrder" FROM "ProductImage" pi JOIN "Product" p ON p.id=pi."productId" WHERE p.model='SDL1020X' ORDER BY pi."sortOrder"`);
  const all = [{ path: cover.rows[0].coverImage, sort: 0 }].concat(imgs.rows.map((r) => ({ path: r.imagePath, sort: r.sortOrder })));
  console.log("SDL1020X 图片数:", all.length);
  all.forEach((x) => console.log("  sort", x.sort, x.path));
  await c.end();
})();
