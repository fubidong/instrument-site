const { Client } = require("pg");
const { execFileSync } = require("child_process");
const fs = require("fs");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model, "coverImage" FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT') AND (model LIKE 'SDS6034%' OR model LIKE 'SDS1102%' OR model LIKE 'SDM3055%' OR model LIKE 'SSG5085%' OR model LIKE 'SDS5034%' OR model LIKE 'SHA852%') LIMIT 8`);
  let i = 0;
  for (const x of r.rows) {
    const src = "E:/cxy/instrument-site/public" + x.coverImage;
    const out = "C:/cxy/cur" + i + ".jpg";
    try {
      execFileSync("cmd.exe", ["/c", "copy", "/Y", src, out], { timeout: 10000 });
      console.log(x.model, "->", x.coverImage);
    } catch (e) {
      console.log(x.model, "NOFILE", x.coverImage);
    }
    i++;
  }
  await c.end();
})();
