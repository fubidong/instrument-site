const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const dir = "C:/cxy/store-crawl";
const g = JSON.parse(fs.readFileSync(path.join(dir, "galleries.json"), "utf8"));
const prods = JSON.parse(fs.readFileSync(path.join(dir, "products.json"), "utf8"));
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const slugNorm = (s) => (s || "").replace(/[^\x00-\x7f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const isAcc = (f) => /^(PB|PP|SP|HP|TP|AT)[0-9]/.test(f) || /注册|证书|手册|软件|驱动|Software|Access/i.test(f);

(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model, id FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')`);
  const db = r.rows;
  const normMap = new Map(db.map((x) => [norm(x.model), x.model]));

  // 第一步：store 页 -> slugNorm
  const pages = [];
  Object.keys(g).forEach((k) => {
    const idx = parseInt(k.replace("p", "").replace(".html", ""), 10);
    const url = prods[idx] || "";
    const slug = slugNorm(decodeURIComponent((url.split("/product/")[1] || "").split("/")[0] || ""));
    const files = g[k].map((u) => u.split("/").pop()).map((f) => f.replace(/"/g, ""));
    const full = g[k].map((u) => u.replace(/"/g, ""));
    // 主图 = 图库第2张（跳配件）
    let mainUrl = null, mainFile = null;
    for (let i = 1; i < files.length; i++) {
      if (isAcc(files[i])) continue;
      mainUrl = full[i]; mainFile = files[i]; break;
    }
    if (!mainUrl) { mainUrl = full[0]; mainFile = files[0]; }
    pages.push({ k, slug, mainUrl, mainFile });
  });

  // 第二步：exact 匹配
  const plan = [];
  const matchedModels = new Set();
  const usedPages = new Set();
  for (const p of pages) {
    const model = normMap.get(p.slug);
    if (!model || matchedModels.has(model)) continue;
    matchedModels.add(model);
    usedPages.add(p.k);
    plan.push({ model, page: p.k, mainUrl: p.mainUrl, mainFile: p.mainFile, matchType: "exact" });
  }
  // 第三步：前缀回退（剩余 store 页给剩余型号）
  for (const p of pages) {
    if (usedPages.has(p.k)) continue;
    let best = null;
    for (const x of db) {
      const n = norm(x.model);
      if (matchedModels.has(x.model)) continue;
      if (p.slug.startsWith(n + "-") || n.startsWith(p.slug + "-")) {
        if (!best || n.length > norm(best.model).length) best = x;
      }
    }
    if (best) {
      matchedModels.add(best.model);
      usedPages.add(p.k);
      plan.push({ model: best.model, page: p.k, mainUrl: p.mainUrl, mainFile: p.mainFile, matchType: "prefix" });
    }
  }
  const all = await c.query(`SELECT model FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')`);
  const missed = all.rows.filter((m) => !matchedModels.has(m.model));
  console.log("匹配:", plan.length, "/", all.rows.length);
  console.log("exact:", plan.filter((p) => p.matchType === "exact").length, "prefix:", plan.filter((p) => p.matchType === "prefix").length);
  console.log("未匹配:", missed.length);
  missed.forEach((m) => console.log("   ", m.model));
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan, null, 1));
  await c.end();
})();
