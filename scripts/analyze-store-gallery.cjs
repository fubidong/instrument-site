// 分析 store 详情页所有图，找干净的产品真图
const { execFileSync } = require("child_process");
const fs = require("fs");
for (const m of ["SDG1062X", "SNA5006X-E"]) {
  const slug = m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  execFileSync("curl.exe", ["-s", "-L", "-o", "C:\\cxy\\_d.html", "-A", "Mozilla/5.0", `https://store.siglent.com/product/${slug}/`], { timeout: 30000 });
  const h = fs.readFileSync("C:/cxy/_d.html", "utf8");
  console.log("###", m);
  const re = /https:\/\/store\.siglent\.com\/wp-content\/uploads\/\d{4}\/\d{2}\/[^"'\\ ]+\.(?:jpg|jpeg|png|webp)/g;
  const all = [...new Set(h.match(re) || [])];
  // 过滤缩略图
  const full = all.filter((u) => !/-150x150/.test(u) && !/logo|icon|banner/.test(u));
  console.log("全尺寸图数:", full.length);
  full.forEach((u) => console.log("  ", u.slice(0, 130)));
}
