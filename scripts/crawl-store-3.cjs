const fs = require("fs");
const { execFileSync } = require("child_process");
const path = require("path");
const dir = "C:/cxy/store-crawl";
const prods = JSON.parse(fs.readFileSync(path.join(dir, "products.json"), "utf8"));
const prodDir = path.join(dir, "prods");
if (!fs.existsSync(prodDir)) fs.mkdirSync(prodDir, { recursive: true });
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
let ok = 0, fail = 0;
prods.forEach((u, i) => {
  const fn = path.join(prodDir, "p" + i + ".html");
  if (fs.existsSync(fn) && fs.statSync(fn).size > 10000) { ok++; return; }
  try {
    execFileSync("curl.exe", ["-L", "-s", "-A", UA, u, "-o", fn], { timeout: 30000 });
    ok++;
  } catch (e) {
    fail++;
  }
  if (i % 30 === 29) console.log("progress", i + 1, "/", prods.length, "ok", ok, "fail", fail);
});
console.log("产品页 ok", ok, "fail", fail);
// 提取每页图库图片（去重）
const galleryMap = {};
fs.readdirSync(prodDir).forEach((f) => {
  if (!f.endsWith(".html")) return;
  const h = fs.readFileSync(path.join(prodDir, f), "utf8");
  const start = h.indexOf("cp-detailGallery");
  let imgs = [];
  if (start > -1) {
    const block = h.slice(start, start + 7000);
    imgs = (block.match(/src="([^"]+)"/g) || []).map((x) => x.replace('src="', ""));
  }
  if (imgs.length) galleryMap[f] = [...new Set(imgs)];
});
fs.writeFileSync(path.join(dir, "galleries.json"), JSON.stringify(galleryMap, null, 1));
console.log("有图库的产品页:", Object.keys(galleryMap).length);
