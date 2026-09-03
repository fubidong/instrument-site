const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const dir = "C:/cxy/store-crawl";
const g = JSON.parse(fs.readFileSync(path.join(dir, "galleries.json"), "utf8"));
const prods = JSON.parse(fs.readFileSync(path.join(dir, "products.json"), "utf8"));
const tokens = (s) => (s || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").split("-").filter(Boolean);
// 对每个产品页，选候选主图：
// 1) 精确匹配型号的干净图（非 -1）
// 2) 否则图库第2张（跳过第1张广告）
const candidates = [];
Object.keys(g).forEach((k) => {
  const idx = parseInt(k.replace("p", "").replace(".html", ""), 10);
  const url = prods[idx] || "";
  const slug = url.split("/product/")[1] ? decodeURIComponent(url.split("/product/")[1].split("/")[0]) : "";
  const files = g[k].map((u) => u.split("/").pop()).map((f) => f.replace(/"/g, ""));
  // 从 slug 推断型号 tokens（slug 如 "sds6034-h10-pro-高分辨率示波器"）
  const slugTokens = tokens(slug.replace(/[^\x00-\x7f]/g, ""));
  // 候选1：文件 tokens 以 slugTokens 开头且非广告
  let clean = null, ad = null, second = null;
  files.forEach((f) => {
    const ft = tokens(f.replace(/\.[a-z0-9]+$/i, ""));
    const rest = ft.slice(slugTokens.length).join("");
    if (ft.length >= slugTokens.length) {
      let ok = true;
      for (let i = 0; i < slugTokens.length; i++) if (ft[i] !== slugTokens[i]) { ok = false; break; }
      if (ok) {
        if (/^1$/.test(rest)) ad = f;
        else if (!clean) clean = f;
      }
    }
  });
  if (files.length > 1) second = files[1]; // 第2张
  candidates.push({ k, slug, clean, ad, second, all: files.slice(0, 4) });
});
// 打印 8 个验证样本
const sampleIdx = [0, 1, 4, 10, 100, 204, 207, 240];
sampleIdx.forEach((i) => {
  if (candidates[i]) {
    const cd = candidates[i];
    console.log(cd.k, "|", cd.slug, "| clean:", cd.clean, "| ad:", cd.ad, "| 2nd:", cd.second);
  }
});
fs.writeFileSync(path.join(dir, "candidates.json"), JSON.stringify(candidates, null, 1));
console.log("候选总数:", candidates.length);
