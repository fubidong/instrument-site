const { Client } = require("pg");
const { execFileSync } = require("child_process");
const fs = require("fs");
const samples = ["SDS6034 H10 PRO", "SDG1062X", "SSA3021X Plus", "SPD3303X", "SDM3055", "SNA5052X", "SHS1072X", "SDM4065A-SC"];
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model, "coverImage" FROM "Product" WHERE model = ANY($1::text[])`, [samples]);
  r.rows.forEach((x) => {
    const src = "E:/cxy/instrument-site/public" + x.coverImage;
    const out = "C:/cxy/verify-" + x.model.replace(/[^A-Za-z0-9]+/g, "_") + ".jpg";
    try {
      fs.copyFileSync(src, out);
      console.log(x.model, "->", out, fs.statSync(out).size, "bytes");
    } catch (e) {
      console.log(x.model, "NOFILE", src);
    }
  });
  await c.end();
})();
