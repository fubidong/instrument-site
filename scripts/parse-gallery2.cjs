// 宽松解析 gallery 容器内所有图 URL
const { execFileSync } = require("child_process");
const fs = require("fs");
function curl(url, out) { execFileSync("curl.exe", ["-s", "-L", "-o", out, "-A", "Mozilla/5.0", url], { timeout: 30000 }); }
for (const m of ["SDG1062X", "SNA5006X-E"]) {
  const slug = m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  curl(`https://store.siglent.com/product/${slug}/`, "C:/cxy/_g.html");
  const h = fs.readFileSync("C:/cxy/_g.html", "utf8");
  const gi = h.indexOf('woocommerce-product-gallery');
  console.log("###", m, "| gallery@", gi);
  if (gi < 0) continue;
  const seg = h.slice(gi, Math.min(gi + 20000, h.length));
  // 找所有 uploads URL（在 gallery 段内）
  const re = /https:\/\/store\.siglent\.com\/wp-content\/uploads\/[^"'\\<> ]+\.(?:jpg|jpeg|png|webp)/g;
  const all = [...new Set(seg.match(re) || [])].filter((u) => !/150x150/.test(u) && !/logo|icon/.test(u));
  console.log("  gallery 全尺寸图:");
  all.forEach((u, i) => console.log(`   [${i + 1}]`, u.slice(0, 130)));
}
