const { Client } = require("pg");
const fs = require("fs");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`
    SELECT p.model, COUNT(pi.id)::int AS n
    FROM "Product" p LEFT JOIN "ProductImage" pi ON pi."productId" = p.id
    WHERE p."brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')
    GROUP BY p.model ORDER BY n DESC LIMIT 6
  `);
  console.log("附加图数TOP:", JSON.stringify(r.rows));
  // 抽样文件存在性
  const s = await c.query(`SELECT pi."imagePath", p.model FROM "ProductImage" pi JOIN "Product" p ON p.id=pi."productId" WHERE p.model='SDS6034 H10 PRO' ORDER BY pi."sortOrder" LIMIT 5`);
  let allOk = true;
  for (const row of s.rows) {
    const ok = fs.existsSync("E:/cxy/instrument-site/public" + row.imagePath);
    if (!ok) allOk = false;
    console.log(row.model, row.imagePath, ok ? "OK" : "MISSING");
  }
  const total = await c.query(`SELECT COUNT(*)::int AS t FROM "ProductImage"`);
  console.log("ProductImage 总数:", total.rows[0].t, "| 抽样文件全部存在:", allOk);
  await c.end();
})();
