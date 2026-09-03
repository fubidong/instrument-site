const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");
// Step1: 下载 store 首页，提取系列页 URL + 产品 URL
const dir = "C:/cxy/store-crawl";
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const home = path.join(dir, "home.html");
try {
  execSync(`curl.exe -L -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "https://store.siglent.com/" -o "${home}"`, { timeout: 60000 });
  const h = fs.readFileSync(home, "utf8");
  console.log("home len", h.length);
  const series = [...new Set(h.match(/\/shop\/\?category=\d+&subcategory=\d+&series=\d+/g) || [])];
  console.log("系列URL:", series.length);
  // 用 category 分组
  const cats = {};
  series.forEach((s) => {
    const c = s.match(/category=(\d+)/)[1];
    (cats[c] = cats[c] || []).push(s);
  });
  Object.keys(cats).forEach((c) => console.log("  category", c, "->", cats[c].length, "系列"));
  // 产品URL
  const prods = [...new Set(h.match(/https:\/\/store\.siglent\.com\/product\/[^"']+/g) || [])];
  console.log("首页产品URL:", prods.length);
  prods.slice(0, 10).forEach((p) => console.log("  ", p.slice(0, 100)));
  fs.writeFileSync(path.join(dir, "series.json"), JSON.stringify(series, null, 1));
  fs.writeFileSync(path.join(dir, "products.json"), JSON.stringify(prods, null, 1));
} catch (e) {
  console.log("ERR", String(e).slice(0, 200));
}
