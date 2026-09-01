// 精确定位 store 详情页 gallery 主图容器，按 DOM 顺序取图
const { execFileSync } = require("child_process");
const fs = require("fs");
function curl(url, out) { execFileSync("curl.exe", ["-s", "-L", "-o", out, "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "--max-time", "25", url], { timeout: 35000 }); }
const m = "SDG1062X";
const slug = m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
curl(`https://store.siglent.com/product/${slug}/`, "C:/cxy/_s2.html");
const h = fs.readFileSync("C:/cxy/_s2.html", "utf8");
// 找所有 woocommerce-product-gallery 出现位置
let idx = -1, c = 0;
while ((idx = h.indexOf("woocommerce-product-gallery", idx + 1)) >= 0) {
  c++;
  if (c <= 3) console.log(`出现${c} @`, idx, ":", h.slice(idx - 40, idx + 90).replace(/\s+/g, " ").slice(0, 120));
}
// 找 main product 区域的图
const mi = h.indexOf('id="product-');
console.log("\nproduct id 区域 @", mi);
if (mi >= 0) {
  const seg = h.slice(mi, mi + 4000);
  const re = /https:\/\/store\.siglent\.com\/wp-content\/uploads\/[^"'\\<> ]+\.(?:jpg|jpeg|png)/g;
  const all = [...new Set(seg.match(re) || [])].filter((u) => !/150x150/.test(u));
  console.log("主图区图:", all.length);
  all.forEach((u, i) => console.log(`  [${i + 1}]`, u.slice(0, 120)));
}
