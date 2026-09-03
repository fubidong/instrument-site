const fs = require("fs");
const { Client } = require("pg");
(async () => {
  const long = JSON.parse(fs.readFileSync("C:/cxy/long-images.json", "utf8"));
  // 只删竖长图（ratio > 1.5 的详情页宣传长图）；横版产品图保留
  const tall = long.filter((r) => r.ratio > 1.5);
  console.log("竖长图:", tall.length);
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 删除 DB 记录
  let dbDel = 0, fileDel = 0;
  for (const r of tall) {
    const res = await c.query(`DELETE FROM "ProductImage" WHERE "imagePath" = $1 RETURNING "imagePath"`, [r.file]);
    if (res.rowCount > 0) dbDel++;
    const fp = "E:/cxy/instrument-site/public" + r.file.replace(/\\/g, "/");
    if (fs.existsSync(fp)) { fs.unlinkSync(fp); fileDel++; }
  }
  console.log("DB删除:", dbDel, "文件删除:", fileDel);
  const cnt = await c.query(`SELECT COUNT(*)::int AS n FROM "ProductImage"`);
  console.log("ProductImage 剩余:", cnt.rows[0].n);
  await c.end();
})();
