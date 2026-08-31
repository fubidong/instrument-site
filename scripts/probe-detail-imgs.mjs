// 分析型号详情页的图片：找干净主图（匹配型号名，排除广告特征）
import https from "https";

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => resolve({ s: r.statusCode, d }));
    }).on("error", reject);
  });
}

// 测 3 个型号：VNA(series名-S3X-E), 示波器(SDS6034 H10 PRO), 信号源
const urls = [
  ["SNA5003X-E", "https://store.siglent.com/product/sna5003x-e-%e7%9f%a2%e9%87%8f%e7%bd%91%e7%bb%9c%e5%88%86%e6%9e%90%e4%bb%aa/"],
  ["SDS6034 H10 PRO", "https://store.siglent.com/product/sds6034-h10-pro-%e9%ab%98%e5%88%86%e8%be%a8%e7%8e%87%e7%a4%ba%e6%b3%a2%e5%99%a8/"],
  ["SSG5040X", "https://store.siglent.com/product/ssg5040x-%e5%b0%84%e9%a2%91%e6%a8%a1%e6%8b%9f%e7%9f%a2%e9%87%8f%e4%bf%a1%e5%8f%b7%e5%8f%91%e7%94%9f%e5%99%a8/"],
];

for (const [model, url] of urls) {
  const r = await get(url);
  if (r.s !== 200) {
    console.log(model, "status", r.s);
    continue;
  }
  const imgs = [...r.d.matchAll(/https:\/\/store\.siglent\.com\/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|png)/g)].map((m) => m[0]);
  const uniq = [...new Set(imgs)].filter((u) => !/150x150|100x100|300x300|logo|favicon/.test(u));
  console.log(`\n=== ${model} (${uniq.length} imgs) ===`);
  uniq.slice(0, 10).forEach((u) => console.log(" ", u.split("/").pop()));
}
