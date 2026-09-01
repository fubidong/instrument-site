// 采样对比：store gallery 全尺寸图 vs 官网产品页 og:image
const { execFileSync } = require("child_process");
const fs = require("fs");
function curl(url, out) { execFileSync("curl.exe", ["-s", "-L", "-o", out, "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "--max-time", "25", url], { timeout: 35000 }); }
function getOg(url) {
  curl(url, "C:/cxy/_o.html");
  const h = fs.readFileSync("C:/cxy/_o.html", "utf8");
  const og = (h.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || "";
  return { og, len: h.length };
}
function storeGallery(model) {
  const slug = model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  curl(`https://store.siglent.com/product/${slug}/`, "C:/cxy/_s.html");
  const h = fs.readFileSync("C:/cxy/_s.html", "utf8");
  const re = /https:\/\/store\.siglent\.com\/wp-content\/uploads\/\d{4}\/\d{2}\/[^"'\\<> ]+\.(?:jpg|jpeg|png)/g;
  const all = [...new Set(h.match(re) || [])].filter((u) => !/150x150/.test(u) && !/logo|icon|banner/.test(u));
  return { all, len: h.length };
}
const tests = ["SDS1104X-E", "SPS5041X", "SSA3015X-Plus", "SDS5104X", "SDS802X-HD", "SDG2082X", "SSG6083A", "SNA5052X"];
for (const m of tests) {
  const s = slugModel(m);
  const { all, len } = storeGallery(m);
  console.log("###", m, "| store HTML", len, "| 全尺寸图", all.length);
  all.slice(0, 8).forEach((u) => console.log("    ", u.slice(0, 115)));
}
function slugModel(m){ return m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
