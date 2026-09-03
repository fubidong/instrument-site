const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model, "coverImage" FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')`);
  let ok = 0, miss = 0;
  const missList = [];
  for (const x of r.rows) {
    if (!x.coverImage) { miss++; missList.push(x.model + " (无)"); continue; }
    const fp = "E:/cxy/instrument-site/public" + x.coverImage;
    if (fs.existsSync(fp)) ok++;
    else { miss++; missList.push(x.model + " -> " + x.coverImage); }
  }
  console.log("存在:", ok, "缺失:", miss);
  missList.slice(0, 20).forEach((m) => console.log("  ", m));
  await c.end();
})();
