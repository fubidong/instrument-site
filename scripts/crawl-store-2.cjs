const fs = require("fs");
const { execFileSync } = require("child_process");
const path = require("path");
const dir = "C:/cxy/store-crawl";
const series = JSON.parse(fs.readFileSync(path.join(dir, "series.json"), "utf8"));
const allProds = new Set(JSON.parse(fs.readFileSync(path.join(dir, "products.json"), "utf8")));
const seriesDir = path.join(dir, "series");
if (!fs.existsSync(seriesDir)) fs.mkdirSync(seriesDir, { recursive: true });
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
let ok = 0, fail = 0;
series.forEach((s, i) => {
  const fn = path.join(seriesDir, "s" + i + ".html");
  if (fs.existsSync(fn) && fs.statSync(fn).size > 10000) { ok++; return; }
  try {
    execFileSync("curl.exe", ["-L", "-s", "-A", UA, "https://store.siglent.com" + s, "-o", fn], { timeout: 30000 });
    ok++;
  } catch (e) {
    fail++;
  }
  if (i % 10 === 9) console.log("progress", i + 1, "/", series.length, "ok", ok, "fail", fail);
});
fs.readdirSync(seriesDir).forEach((f) => {
  if (!f.endsWith(".html")) return;
  const h = fs.readFileSync(path.join(seriesDir, f), "utf8");
  const found = h.match(/https:\/\/store\.siglent\.com\/product\/[^"']+/g) || [];
  found.forEach((u) => allProds.add(u));
});
console.log("系列页 ok", ok, "fail", fail);
console.log("产品URL总数:", allProds.size);
fs.writeFileSync(path.join(dir, "products.json"), JSON.stringify([...allProds], null, 1));
