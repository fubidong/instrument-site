// 测试直接抓 store 详情页 HTML（无需浏览器）
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

const r = await get("https://store.siglent.com/product/sna5003x-e-%e7%9f%a2%e9%87%8f%e7%bd%91%e7%bb%9c%e5%88%86%e6%9e%90%e4%bb%aa/");
console.log("status:", r.s, "len:", r.d.length);

// 找 cp-excerpt
const idx = r.d.indexOf("cp-excerpt");
console.log("cp-excerpt found:", idx >= 0);
if (idx >= 0) {
  console.log("snippet:", r.d.slice(idx, idx + 600).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 400));
}

// 找 gallery 大图
const imgs = [...r.d.matchAll(/https:\/\/store\.siglent\.com\/wp-content\/uploads\/[^"'\s]+\.(?:jpg|png)/g)].map((m) => m[0]);
const big = [...new Set(imgs)].filter((u) => !/150x150|100x100|300x300/.test(u));
console.log("\ngallery images:", big.length);
big.slice(0, 8).forEach((u) => console.log(" ", u));
