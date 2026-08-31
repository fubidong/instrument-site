// 探测 store API 是否有型号级参数（variations/attributes）
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

// 找 SDS6034 H10 Pro 产品
const list = JSON.parse((await get("https://store.siglent.com/wp-json/wp/v2/product?search=SDS6034&per_page=5")).d);
const p = list.find((x) => x.slug.includes("sds6034-h10-pro"));
console.log("id:", p?.id, "slug:", p?.slug);

if (p) {
  // 完整产品详情
  const detail = JSON.parse((await get(`https://store.siglent.com/wp-json/wp/v2/product/${p.id}`)).d);
  console.log("detail keys:", Object.keys(detail).join(", "));
  // variations
  const vars = await get(`https://store.siglent.com/wp-json/wc/v3/products/${p.id}/variations`);
  console.log("wc variations status:", vars.s, vars.d.slice(0, 200));
  // attributes
  console.log("attributes:", JSON.stringify(detail.attributes || []).slice(0, 300));
  console.log("meta full:", JSON.stringify(detail.meta).slice(0, 500));
  // ACF
  console.log("acf:", JSON.stringify(detail.acf).slice(0, 300));
}
