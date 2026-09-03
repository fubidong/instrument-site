const fs = require("fs");
const { Client } = require("pg");
(async () => {
  const long = JSON.parse(fs.readFileSync("C:/cxy/long-images.json", "utf8"));
  const tall = long.filter((r) => r.ratio > 1.5);
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  let dbDel = 0, missing = [];
  for (const r of tall) {
    // 反斜杠统一转正斜杠
    const norm = r.file.replace(/\\/g, "/");
    const res = await c.query(`DELETE FROM "ProductImage" WHERE "imagePath" = $1 RETURNING "imagePath"`, [norm]);
    if (res.rowCount > 0) dbDel++;
    else missing.push(norm);
  }
  console.log("DB删除:", dbDel, "未匹配:", missing.length);
  if (missing.length) { console.log("未匹配样例:", missing.slice(0, 5)); }
  // 查是否还有指向不存在文件的记录
  const orphan = await c.query(`SELECT COUNT(*)::int AS n FROM "ProductImage" pi WHERE NOT EXISTS (SELECT 1 FROM pg_class) OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class)`);
  const cnt = await c.query(`SELECT COUNT(*)::int AS n FROM "ProductImage"`);
  console.log("ProductImage 剩余:", cnt.rows[0].n);
  await c.end();
})();
