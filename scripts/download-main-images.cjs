const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { Client } = require("pg");
const dir = "C:/cxy/store-crawl";
const plan = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8"));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const REF = "https://store.siglent.com/";
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // model -> coverImage
  const r = await c.query(`SELECT model, "coverImage" FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')`);
  const coverMap = new Map(r.rows.map((x) => [x.model, x.coverImage]));
  let ok = 0, fail = 0, skipped = 0;
  for (const p of plan) {
    const cover = coverMap.get(p.model);
    if (!cover) { skipped++; continue; }
    const target = "E:/cxy/instrument-site/public" + cover;
    // 验证扩展名
    const ext = path.extname(cover).toLowerCase();
    try {
      execFileSync("curl.exe", ["-L", "-s", "-A", UA, "-e", REF, p.mainUrl, "-o", target], { timeout: 40000 });
      const size = fs.statSync(target).size;
      if (size > 2000) ok++;
      else { fail++; console.log("TOO SMALL", p.model, p.mainFile, size); }
    } catch (e) {
      fail++;
      console.log("FAIL", p.model, p.mainFile, String(e.message).slice(0, 80));
    }
  }
  console.log("下载完成 ok:", ok, "fail:", fail, "skip(无cover):", skipped);
  await c.end();
})();
