const { Client } = require("pg");
const fs = require("fs");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT "imagePath" FROM "ProductImage"`);
  let orphan = 0;
  const samples = [];
  for (const row of r.rows) {
    const fp = "E:/cxy/instrument-site/public" + row.imagePath;
    if (!fs.existsSync(fp)) { orphan++; if (samples.length < 8) samples.push(row.imagePath); }
  }
  console.log("ProductImage 总数:", r.rows.length);
  console.log("孤儿记录:", orphan);
  samples.forEach((s) => console.log("  ", s));
  await c.end();
})();
