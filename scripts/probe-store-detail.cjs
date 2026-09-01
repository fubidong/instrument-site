// 批量探测 store 产品详情页主图（og:image），测试命名规则
const { execSync } = require("child_process");
const fs = require("fs");
const models = ["SDS5054X-HD","SDS1104X-E","SPS5041X","SMM3311X","SHS1102X","SDS6034-H10-PRO","SSA3015X-Plus","SPD3303X","SDM4065A","SDL1030X"];
function slug(m) {
  return m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
for (const m of models) {
  const u = `https://store.siglent.com/product/${slug(m)}/`;
  try {
    execSync(`curl.exe -s -L -o C:\\cxy\\probe.html -A "Mozilla/5.0" "${u}"`, { timeout: 25000 });
    const h = fs.readFileSync("C:/cxy/probe.html", "utf8");
    const og = h.match(/<meta property="og:image" content="([^"]+)"/);
    const ogUrl = og ? og[1] : null;
    const title = h.match(/<title>([^<]+)<\/title>/);
    const imgRe = /https:\/\/store\.siglent\.com\/wp-content\/uploads\/\d{4}\/\d{2}\/[^"'\\]+\.(?:jpg|jpeg|png)/g;
    const imgs = new Set();
    let mm; while ((mm = imgRe.exec(h))) imgs.add(mm[0]);
    const mainImgs = [...imgs].filter((x) => /\/\d{4}\/\d{2}\/[^/]+\.(jpg|jpeg)/.test(x));
    console.log(m.padEnd(18), "| og:", ogUrl ? ogUrl.slice(ogUrl.length - 50) : "无");
    console.log(" ".repeat(20), "| 主图:", mainImgs[0] ? mainImgs[0].slice(0, 100) : "无");
    console.log(" ".repeat(20), "| title:", (title ? title[1] : "?").slice(0, 40));
  } catch (e) {
    console.log(m.padEnd(18), "| ERR", String(e).slice(0, 60));
  }
}
