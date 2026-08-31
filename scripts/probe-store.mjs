import https from "https";

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => resolve({ s: r.statusCode, d }));
    }).on("error", reject);
  });
}

// 找 SDS6034 产品 id
const list = JSON.parse((await get("https://store.siglent.com/wp-json/wp/v2/product?search=SDS6034&per_page=5")).d);
const p = list.find((x) => x.slug.includes("sds6034-h10-pro"));
console.log("product id:", p?.id, "slug:", p?.slug);

if (p) {
  // 图库附件
  const media = JSON.parse((await get(`https://store.siglent.com/wp-json/wp/v2/media?parent=${p.id}&per_page=10`)).d);
  console.log("attachments:", media.length);
  media.forEach((m) => console.log("  img:", m.source_url, "| alt:", m.alt_text));
  // 单产品详情看是否有参数字段
  const detail = await get(`https://store.siglent.com/wp-json/wp/v2/product/${p.id}`);
  const dp = JSON.parse(detail.d);
  console.log("detail keys:", Object.keys(dp).filter((k) => !["_links", "yoast_head"].includes(k)).join(", "));
  console.log("meta:", JSON.stringify(dp.meta).slice(0, 500));
}
