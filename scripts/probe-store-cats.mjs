import https from "https";

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => resolve({ s: r.statusCode, d, h: r.headers }));
    }).on("error", reject);
  });
}

// 拉取 store 产品分类
const r = await get("https://store.siglent.com/wp-json/wp/v2/product_cat?per_page=100&hide_empty=false");
const cats = JSON.parse(r.d);
console.log("TOTAL CATS:", cats.length);
for (const c of cats) {
  console.log(`${c.slug} | count=${c.count} | parent=${c.parent} | name=${c.name}`);
}
