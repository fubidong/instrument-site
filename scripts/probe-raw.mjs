import fs from "fs";

const raw = JSON.parse(fs.readFileSync("scripts/data/siglent-raw.json", "utf8"));
const entries = Object.entries(raw);
console.log("raw entries:", entries.length);

// 找 SDS7000A
const sds7000 = entries.find(([k, v]) => v && (v.slug === "sds7000a" || v.name === "SDS7000A"));
if (!sds7000) {
  // 打印几个样例的 slug
  console.log("sample slugs:", entries.slice(0, 5).map(([k, v]) => `${k}:${v?.slug}/${v?.name}`).join(", "));
  process.exit(0);
}
const p = sds7000[1];
console.log("series:", p.name, "| slug:", p.slug);
console.log("keys:", Object.keys(p).join(", "));
console.log("category:", JSON.stringify(p.category || p.categories || {}).slice(0, 300));
const attrs = p.attributes || [];
const modelAttr = attrs.find((a) => a.taxonomy === "pa_product-model");
console.log("models:", modelAttr ? modelAttr.terms.map((t) => t.name).join(", ") : "none");
console.log("variations:", JSON.stringify(p.variations || []).slice(0, 400));
console.log("featuredImage:", p.featuredImage);
