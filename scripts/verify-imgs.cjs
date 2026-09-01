const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model, "coverImage" FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT') ORDER BY model`);
  let noImg = 0, fileMiss = 0;
  const root = "E:\\cxy\\instrument-site\\public";
  for (const x of r.rows) {
    if (!x.coverImage) noImg++;
    const p = path.join(root, x.coverImage.replace(/^\//, ""));
    if (!fs.existsSync(p)) { fileMiss++; if (fileMiss <= 5) console.log("文件缺失:", x.model, x.coverImage); }
  }
  console.log("总产品:", r.rows.length, "| 无 coverImage:", noImg, "| 本地文件缺失:", fileMiss);
  // 抽查更新后样本
  const samp = await c.query(`SELECT model, "coverImage" FROM "Product" WHERE model IN ('SNA5006X-E','SDG1062X','SDS5054X HD','SHA851A','SSA3015X PLUS','SPS5041X')`);
  samp.rows.forEach((x) => console.log(x.model.padEnd(16), x.coverImage));
  await c.end();
})();
