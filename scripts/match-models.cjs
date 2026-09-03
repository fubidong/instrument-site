const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const dir = "C:/cxy/store-crawl";
const g = JSON.parse(fs.readFileSync(path.join(dir, "galleries.json"), "utf8"));
// 产品页文件名顺序与 products.json 对应
const prods = JSON.parse(fs.readFileSync(path.join(dir, "products.json"), "utf8"));
// 从产品 URL 提取 model slug（url 里 /product/sds6034-h10-pro-中文/）
const norm = (s) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model, id FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')`);
  const models = r.rows;
  const modelNorm = new Map(models.map((m) => [norm(m.model), m.model]));
  // 逐页匹配
  const stats = { clean: 0, onlyAd: 0, none: 0, cleanExamples: [], onlyAdExamples: [], noneExamples: [] };
  const matchResults = [];
  Object.keys(g).forEach((k) => {
    const idx = parseInt(k.replace("p", "").replace(".html", ""), 10);
    const url = prods[idx] || "";
    const slug = (url.split("/product/")[1] || "").split("/")[0].split("-")[0] || "";
    const images = g[k];
    // 图文件名
    const files = images.map((u) => u.split("/").pop());
    // 尝试匹配：文件包含 model 前缀
    let matched = [];
    let bestModel = null;
    for (const m of models) {
      const mn = norm(m.model);
      if (mn.length < 6) continue;
      for (const f of files) {
        const fn = norm(f.replace(/\.[a-z0-9]+$/, ""));
        if (fn.startsWith(mn) && fn.length >= mn.length + 1) {
          matched.push({ file: f, model: m.model });
          bestModel = m.model;
        }
      }
    }
    const uniqueFiles = [...new Set(matched.map((x) => x.file))];
    const adFiles = uniqueFiles.filter((f) => /-1(?:\.|$)|-1-/.test(f));
    const cleanFiles = uniqueFiles.filter((f) => !/-1(?:\.|$)|-1-/.test(f));
    if (cleanFiles.length) { stats.clean++; if (stats.cleanExamples.length < 8) stats.cleanExamples.push({ model: bestModel, files: cleanFiles.slice(0, 4) }); }
    else if (adFiles.length) { stats.onlyAd++; if (stats.onlyAdExamples.length < 8) stats.onlyAdExamples.push({ model: bestModel, ad: adFiles.slice(0, 3) }); }
    else { stats.none++; if (stats.noneExamples.length < 8) stats.noneExamples.push({ k, files: files.slice(0, 5) }); }
    matchResults.push({ k, model: bestModel, cleanFiles, adFiles });
  });
  console.log("匹配统计:", JSON.stringify(stats, null, 1).slice(0, 1500));
  await c.end();
})();
