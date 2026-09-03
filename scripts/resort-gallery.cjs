const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 每个产品按 sortOrder 重新编号
  const prods = await c.query(`SELECT DISTINCT "productId" FROM "ProductImage" ORDER BY "productId"`);
  let updated = 0, prodCount = 0;
  for (const p of prods.rows) {
    const imgs = await c.query(`SELECT id FROM "ProductImage" WHERE "productId"=$1 ORDER BY "sortOrder"`, [p.productId]);
    if (imgs.rows.length === 0) continue;
    prodCount++;
    for (let i = 0; i < imgs.rows.length; i++) {
      await c.query(`UPDATE "ProductImage" SET "sortOrder"=$1 WHERE id=$2`, [i + 1, imgs.rows[i].id]);
      updated++;
    }
  }
  console.log("重排产品数:", prodCount, "更新记录:", updated);
  await c.end();
})();
