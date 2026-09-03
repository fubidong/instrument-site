const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 1. SDG 6 型号的 img7（电源线缆配件图）
  const sdgModels = ["SDG1022X", "SDG1032X", "SDG1062X", "SDG1022X Plus", "SDG1032X Plus", "SDG1062X Plus"];
  const r1 = await c.query(`
    DELETE FROM "ProductImage" pi
    USING "Product" p
    WHERE pi."productId" = p.id AND p.model = ANY($1::text[]) AND pi."sortOrder" = 7
    RETURNING pi."imagePath"`, [sdgModels]);
  // 2. SDS1104X HD 的 img4（促销广告图）
  const r2 = await c.query(`
    DELETE FROM "ProductImage" pi
    USING "Product" p
    WHERE pi."productId" = p.id AND p.model = 'SDS1104X HD' AND pi."sortOrder" = 4
    RETURNING pi."imagePath"`);
  const deleted = [...r1.rows, ...r2.rows].map((x) => x.imagePath);
  console.log("删除 DB 记录:", deleted.length);
  deleted.forEach((p) => console.log("  ", p));
  // 删除本地文件
  let fileDel = 0;
  for (const p of deleted) {
    const fp = "E:/cxy/instrument-site/public" + p;
    if (fs.existsSync(fp)) { fs.unlinkSync(fp); fileDel++; }
  }
  console.log("删除本地文件:", fileDel);
  const cnt = await c.query(`SELECT COUNT(*)::int AS n FROM "ProductImage"`);
  console.log("ProductImage 剩余:", cnt.rows[0].n);
  await c.end();
})();
