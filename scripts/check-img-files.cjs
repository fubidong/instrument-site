const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 缺图的产品
  const miss = await c.query(`SELECT model, pl.code AS line FROM "Product" p LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId" WHERE "coverImage" IS NULL OR "coverImage"=''`);
  console.log("== 缺图产品 ==");
  miss.rows.forEach((x) => console.log("  ", x.model, "|", x.line));
  // 抽查本地文件存在性
  const r = await c.query(`SELECT model, "coverImage" FROM "Product" WHERE "coverImage" IS NOT NULL AND "coverImage"<>'' LIMIT 300`);
  let missing = 0, ok = 0;
  const root = "E:\\cxy\\instrument-site\\public";
  const badFiles = [];
  for (const x of r.rows) {
    const p = path.join(root, x.coverImage.replace(/^\//, ""));
    if (fs.existsSync(p)) ok++;
    else { missing++; if (badFiles.length < 10) badFiles.push(x.model + " -> " + x.coverImage); }
  }
  console.log("\n本地文件存在:", ok, "缺失:", missing);
  badFiles.forEach((b) => console.log("  缺失:", b));
  // 检查 uploads 目录内容
  const dir = "E:\\cxy\\instrument-site\\public\\uploads\\product\\2026";
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    console.log("\nuploads/product/2026 文件数:", files.length);
    console.log("样例:", files.slice(0, 10).join(", "));
  } else {
    console.log("\n目录不存在:", dir);
  }
  await c.end();
})();
