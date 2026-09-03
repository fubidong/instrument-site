const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const dir = "C:/cxy/store-crawl";
const g = JSON.parse(fs.readFileSync(path.join(dir, "galleries.json"), "utf8"));
const prods = JSON.parse(fs.readFileSync(path.join(dir, "products.json"), "utf8"));
const clean = (s) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const tokens = (s) => (s || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").split("-").filter(Boolean);

(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model, id FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')`);
  const models = r.rows;
  // 每个产品页：精确匹配主图
  const plan = [];
  const stats = { exactClean: 0, exactAdOnly: 0, seriesClean: 0, none: 0, exactCleanEx: [], exactAdOnlyEx: [], seriesCleanEx: [], noneEx: [] };
  Object.keys(g).forEach((k) => {
    const idx = parseInt(k.replace("p", "").replace(".html", ""), 10);
    const files = g[k].map((u) => u.split("/").pop()).map((f) => f.replace(/"/g, ""));
    // 找出该页对应的 DB 型号：通过 URL slug 找 model（匹配 model 名首 token）
    // 更直接：逐型号精确匹配
    const exactClean = [];
    const exactAd = [];
    for (const m of models) {
      const mt = tokens(m.model);
      if (mt.length === 0) continue;
      for (const f of files) {
        const ft = tokens(f.replace(/\.[a-z0-9]+$/i, ""));
        // 精确：型号 tokens 是文件 tokens 前缀，且文件剩余部分是数字序号（可选）
        let ok = ft.length >= mt.length;
        if (ok) for (let i = 0; i < mt.length; i++) if (ft[i] !== mt[i]) { ok = false; break; }
        if (ok) {
          const rest = ft.slice(mt.length).join("");
          const isAd = /^1$/.test(rest); // 序号1 = 广告
          if (isAd) exactAd.push(f);
          else exactClean.push(f);
        }
      }
    }
    const cleanUnique = [...new Set(exactClean)];
    const adUnique = [...new Set(exactAd)];
    // 系列代表图回退：文件名含系列名（如 SDS6000-PRO）非广告
    if (cleanUnique.length) {
      stats.exactClean++;
      if (stats.exactCleanEx.length < 10) stats.exactCleanEx.push({ k, files: cleanUnique.slice(0, 3) });
    } else if (adUnique.length) {
      stats.exactAdOnly++;
      if (stats.exactAdOnlyEx.length < 10) stats.exactAdOnlyEx.push({ k, ad: adUnique.slice(0, 2), files: files.slice(0, 4) });
    } else {
      stats.none++;
      if (stats.noneEx.length < 10) stats.noneEx.push({ k, files: files.slice(0, 5) });
    }
  });
  console.log("精确匹配统计:", JSON.stringify(stats, null, 1).slice(0, 2200));
  await c.end();
})();
