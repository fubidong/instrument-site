// 匹配 store 产品 → 官网系列/型号（改进版：归一化匹配）
import fs from "fs";

const store = JSON.parse(fs.readFileSync("scripts/data/store-products.json", "utf8"));
const siglent = JSON.parse(fs.readFileSync("scripts/data/siglent-products.json", "utf8"));

// 官网所有型号 → 所属系列（归一化 key：去空格、大写）
const modelToSeries = {};
const normSet = new Set();
for (const s of siglent) {
  for (const m of s.models) {
    const key = m.replace(/\s+/g, "").toUpperCase();
    modelToSeries[key] = s;
    normSet.add(key);
  }
}
console.log("官网型号总数:", Object.keys(modelToSeries).length);

// store 标题提取型号（允许型号中文间无空格，支持多词型号）
function extractModel(title) {
  // 匹配开头的字母数字型号串（含空格、+、/、-），到中文或结尾
  const m = title.match(/^([A-Za-z0-9][A-Za-z0-9\s+\/-]*?)(?=\s*[\u4e00-\u9fa5]|$)/);
  return m ? m[1].trim() : null;
}

// 归一化：去所有空格（含型号内部如 "SDS6034 H10 PRO"）
const norm = (s) => (s || "").replace(/\s+/g, "").toUpperCase();

const matched = [];
const unmatched = [];
for (const p of store) {
  const model = extractModel(p.title);
  if (!model) {
    unmatched.push({ title: p.title, reason: "no-model" });
    continue;
  }
  const n = norm(model);
  const series = modelToSeries[n];
  if (series) {
    matched.push({ ...p, model, series: series.name, line: series.line });
  } else {
    // 尝试部分匹配：model 去掉尾部的 "H10/H12 PRO" 变体
    const base = model.replace(/\s*(H\d\d|PRO)\s*$/i, "");
    const nb = norm(base);
    const s2 = modelToSeries[nb];
    if (s2) {
      matched.push({ ...p, model, series: s2.name, line: s2.line });
    } else {
      unmatched.push({ title: p.title, model, reason: "no-match" });
    }
  }
}

console.log("\n匹配到官网系列:", matched.length);
console.log("未匹配:", unmatched.length);
console.log("\n=== 未匹配样例 (前 40) ===");
unmatched.slice(0, 40).forEach((u) => console.log(`${u.reason}\t${u.title}`));

const matchedSeries = new Set(matched.map((m) => m.series));
console.log("\n覆盖系列数:", matchedSeries.size, "/", siglent.length);
console.log("未覆盖系列:", siglent.filter((s) => !matchedSeries.has(s.name)).map((s) => s.name).join(", "));

fs.writeFileSync("scripts/data/store-matched.json", JSON.stringify(matched, null, 1));
console.log("\nsaved store-matched.json, matched:", matched.length);
