const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const dir = "C:/cxy/store-crawl";
// 读已下载产品页 HTML 提取图库
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const slugNorm = (s) => (s || "").replace(/[^\x00-\x7f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const isAcc = (f) => {
  // 配件/附件/软件/注册/证书图（排除：产品前缀 + 系列图 1-NN 之外的图）
  if (/^(SP|PB|PP|TP|AT|CP|UP|ST|CS|SC|HPB|DP|BP|EA|DS|BNC|RF|USB|LAN|GPIB|PC)[0-9]/.test(f)) return true;
  if (/注册|证书|手册|软件|驱动|说明书|保修|开机|升级|Software|Access|Accessory|Driver|Manual|Certificate|Calibrat/i.test(f)) return true;
  return false;
};

(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model, id FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')`);
  const db = r.rows;
  const normMap = new Map(db.map((x) => [norm(x.model), { model: x.model, id: x.id }]));

  const prods = JSON.parse(fs.readFileSync(path.join(dir, "products.json"), "utf8"));
  const prodDir = path.join(dir, "prods");
  // 每产品页 -> model 映射（复用 plan.json 的匹配逻辑）
  // 先建 slugNorm -> page
  const pages = [];
  fs.readdirSync(prodDir).forEach((f) => {
    if (!f.endsWith(".html")) return;
    const idx = parseInt(f.replace("p", "").replace(".html", ""), 10);
    const url = prods[idx] || "";
    const slug = slugNorm(decodeURIComponent((url.split("/product/")[1] || "").split("/")[0] || ""));
    pages.push({ file: f, idx, slug });
  });
  // 匹配 model（exact + prefix）
  const pageModel = new Map();
  const used = new Set();
  for (const p of pages) {
    const m = normMap.get(p.slug);
    if (m && !used.has(m.model)) { pageModel.set(p.file, m); used.add(m.model); }
  }
  for (const p of pages) {
    if (pageModel.has(p.file)) continue;
    for (const x of db) {
      const n = norm(x.model);
      if (used.has(x.model)) continue;
      if (p.slug.startsWith(n + "-") || n.startsWith(p.slug + "-")) {
        pageModel.set(p.file, { model: x.model, id: x.id });
        used.add(x.model);
        break;
      }
    }
  }

  // 提取每页图库（第2张起，排广告/配件/注册）
  const galleryPlan = {};
  fs.readdirSync(prodDir).forEach((f) => {
    if (!f.endsWith(".html")) return;
    const pm = pageModel.get(f);
    if (!pm) return;
    const h = fs.readFileSync(path.join(prodDir, f), "utf8");
    const start = h.indexOf("cp-detailGallery");
    if (start < 0) return;
    const block = h.slice(start, start + 7000);
    const urls = (block.match(/src="([^"]+)"/g) || []).map((x) => x.replace('src="', "").replace(/"/g, ""));
    // 去重（保序）
    const seen = new Set();
    const unique = urls.filter((u) => { if (seen.has(u)) return false; seen.add(u); return true; });
    // 第2张起，排配件
    const clean = [];
    for (let i = 1; i < unique.length; i++) {
      const fn = unique[i].split("/").pop();
      if (isAcc(fn)) continue;
      clean.push(unique[i]);
    }
    if (clean.length) galleryPlan[pm.model] = { productId: pm.id, images: clean };
  });
  // 统计
  let total = 0, countDist = {};
  Object.values(galleryPlan).forEach((g2) => {
    total += g2.images.length;
    const n = g2.images.length;
    countDist[n] = (countDist[n] || 0) + 1;
  });
  console.log("有图产品:", Object.keys(galleryPlan).length, "总图数:", total);
  console.log("每产品图数分布:", JSON.stringify(countDist));
  fs.writeFileSync(path.join(dir, "gallery-plan.json"), JSON.stringify(galleryPlan, null, 1));
  // 抽样
  let i = 0;
  for (const [m, g2] of Object.entries(galleryPlan)) {
    if (i >= 5) break;
    console.log("---", m);
    g2.images.forEach((u) => console.log("   ", u.split("/").pop()));
    i++;
  }
  await c.end();
})();
