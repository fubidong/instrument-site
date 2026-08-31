import https from "https";
import fs from "fs";

const BASE = "https://store.siglent.com/wp-json/wp/v2";
const PER = 100;

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => resolve({ s: r.statusCode, d, h: r.headers }));
    }).on("error", reject);
  });
}

// 先拿总数
const first = await get(`${BASE}/product?per_page=${PER}&page=1&_embed`);
const total = Number(first.h["x-wp-total"]);
const pages = Number(first.h["x-wp-totalpages"]);
console.log("total:", total, "pages:", pages);

const all = JSON.parse(first.d);
const remaining = [];
for (let page = 2; page <= pages; page++) {
  const r = await get(`${BASE}/product?per_page=${PER}&page=${page}&_embed`);
  if (r.s !== 200) {
    console.log("page", page, "status", r.s);
    continue;
  }
  remaining.push(...JSON.parse(r.d));
  if (page % 25 === 0) console.log("fetched", page, "/", pages);
}
all.push(...remaining);
console.log("collected:", all.length);

// 精简字段
const slim = all.map((p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title?.rendered || "",
  link: p.link,
  cats: (p._embedded?.["wp:term"] || []).flat().filter((t) => t.taxonomy === "product_cat").map((t) => ({ name: t.name, slug: t.slug, id: t.id })),
  featured: (p._embedded?.["wp:featuredmedia"]?.[0]?.source_url) || null,
}));

fs.writeFileSync("scripts/data/store-products.json", JSON.stringify(slim, null, 2));
console.log("saved scripts/data/store-products.json", slim.length);
