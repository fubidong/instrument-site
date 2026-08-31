// 提取 cp-detailGallery 容器内的图片顺序
import https from "https";
import { TextDecoder } from "util";

function getRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }, (r) => {
      const chunks = [];
      r.on("data", (c) => chunks.push(c));
      r.on("end", () => resolve(new TextDecoder("utf-8").decode(Buffer.concat(chunks))));
    }).on("error", reject);
  });
}

// 测试 3 个型号
const urls = [
  ["SDS804X HD", "https://store.siglent.com/product/sds804x-hd-%e9%ab%98%e6%b8%85%e7%a4%ba%e6%b3%a2%e5%99%a8/"],
  ["SDS6034 H10 PRO", "https://store.siglent.com/product/sds6034-h10-pro-%e9%ab%98%e5%88%86%e8%be%a8%e7%8e%87%e7%a4%ba%e6%b3%a2%e5%99%a8/"],
  ["SNA5003X-E", "https://store.siglent.com/product/sna5003x-e-%e7%9f%a2%e9%87%8f%e7%bd%91%e7%bb%9c%e5%88%86%e6%9e%90%e4%bb%aa/"],
  ["SSG5083A", "https://store.siglent.com/product/ssg5083a-%e5%b0%84%e9%a2%91%e6%a8%a1%e6%8b%9f%e7%9f%a2%e9%87%8f%e4%bf%a1%e5%8f%b7%e5%8f%91%e7%94%9f%e5%99%a8/"],
];

for (const [model, url] of urls) {
  const html = await getRaw(url);
  const gIdx = html.indexOf('class="cp-detailGallery"');
  console.log(`\n=== ${model} (gallery at ${gIdx}) ===`);
  if (gIdx < 0) {
    console.log("  no cp-detailGallery");
    continue;
  }
  // 提取容器后 5000 字符内的图片
  const seg = html.slice(gIdx, gIdx + 8000);
  const imgs = [...new Set([...seg.matchAll(/https:\/\/store\.siglent\.com\/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|png)/g)].map((m) => m[0]))];
  imgs.slice(0, 6).forEach((u, i) => console.log(`  [${i}] ${u.split("/").pop()}`));
}
