// 分析匹配到的 store 产品：系列分布 + 重复 + 分类
import fs from "fs";

const matched = JSON.parse(fs.readFileSync("scripts/data/store-matched.json", "utf8"));

// 按系列分布
const bySeries = {};
for (const m of matched) {
  (bySeries[m.series] = bySeries[m.series] || []).push(m);
}

console.log("总匹配:", matched.length, "系列:", Object.keys(bySeries).length);
console.log("\n=== 按系列 ===");
for (const [s, list] of Object.entries(bySeries)) {
  // 该系列产品分类集合
  const cats = new Set();
  list.forEach((m) => m.cats.forEach((c) => cats.add(c.name)));
  console.log(`${s} (${list.length}) cats: ${[...cats].join(",")}`);
}

// 检查重复型号
const modelCount = {};
matched.forEach((m) => (modelCount[m.model] = (modelCount[m.model] || 0) + 1));
const dups = Object.entries(modelCount).filter(([, n]) => n > 1);
console.log("\n重复型号:", dups.length);
dups.slice(0, 20).forEach(([m, n]) => console.log(`  ${m} x${n}`));

// 查看匹配产品的分类构成（判断是否混入附件）
const catCount = {};
matched.forEach((m) => m.cats.forEach((c) => (catCount[c.name] = (catCount[c.name] || 0) + 1)));
console.log("\n=== 匹配产品分类 ===");
Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([c, n]) => console.log(`${n}\t${c}`));
