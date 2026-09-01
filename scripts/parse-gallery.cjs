// 解析 store 详情页 gallery 结构，定位产品主图（跳过促销图）
const { execFileSync } = require("child_process");
const fs = require("fs");
function curl(url, out) { execFileSync("curl.exe", ["-s", "-L", "-o", out, "-A", "Mozilla/5.0", url], { timeout: 30000 }); }
for (const m of ["SDG1062X", "SNA5006X-E"]) {
  const slug = m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  curl(`https://store.siglent.com/product/${slug}/`, "C:/cxy/_g.html");
  const h = fs.readFileSync("C:/cxy/_g.html", "utf8");
  console.log("###", m, "HTML len", h.length);
  // 找 gallery 容器
  const galleryRe = /woocommerce-product-gallery[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/;
  // 找 main gallery 里的 img（按 DOM 顺序）
  const imgRe = /<img[^>]+src="([^"]+)"[^>]*>/g;
  let mm, seq = 0;
  // 只找 gallery 容器内
  const gi = h.indexOf('woocommerce-product-gallery');
  const seg = gi >= 0 ? h.slice(gi, gi + 12000) : h;
  console.log("gallery 容器位置:", gi >= 0 ? "找到" : "未找到");
  while ((mm = imgRe.exec(seg))) {
    const u = mm[1];
    if (!/logo|icon|banner/.test(u)) { seq++; console.log(`  [${seq}]`, u.slice(0, 130)); }
    if (seq > 8) break;
  }
}
