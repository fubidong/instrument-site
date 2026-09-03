const fs = require("fs");
const { execSync } = require("child_process");
// 从 series 页提取产品 URL，下载前几个产品页分析图库
const h = fs.readFileSync("C:/cxy/store-series.html", "utf8");
const urls = [...new Set(h.match(/https:\/\/store\.siglent\.com\/product\/[^"']+/g) || [])];
console.log("产品URL数:", urls.length);
const sample = urls.slice(0, 4);
for (const u of sample) {
  const fname = "C:/cxy/prod-" + urls.indexOf(u) + ".html";
  try {
    execSync(`curl.exe -L -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${u}" -o "${fname}"`, { timeout: 30000 });
    const ph = fs.readFileSync(fname, "utf8");
    const start = ph.indexOf("cp-detailGallery");
    let imgs = [];
    if (start > -1) {
      const block = ph.slice(start, start + 6000);
      imgs = block.match(/src="([^"]+)"/g) || [];
      imgs = imgs.map((i) => i.replace('src="', ""));
    }
    console.log("---", u.split("/product/")[1].slice(0, 50), "图库:", imgs.length);
    imgs.forEach((i) => console.log("   ", i.replace("https://store.siglent.com/wp-content/uploads/", "")));
  } catch (e) {
    console.log("ERR", u.slice(0, 60), String(e).slice(0, 80));
  }
}
