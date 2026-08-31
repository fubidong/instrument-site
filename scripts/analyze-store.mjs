import fs from "fs";

const products = JSON.parse(fs.readFileSync("scripts/data/store-products.json", "utf8"));
console.log("total products:", products.length);

// 所有分类的 slug/name 出现次数
const catCount = {};
const catInfo = {};
for (const p of products) {
  for (const c of p.cats) {
    catCount[c.name] = (catCount[c.name] || 0) + 1;
    catInfo[c.name] = c.slug;
  }
}
console.log("\n=== CATEGORY COUNTS ===");
Object.entries(catCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([name, n]) => console.log(`${n}\t${name}\t(${catInfo[name]})`));
