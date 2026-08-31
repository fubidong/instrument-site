// 生成最终型号采集清单：排除套餐/附件/软件，去重
import fs from "fs";

const matched = JSON.parse(fs.readFileSync("scripts/data/store-matched.json", "utf8"));

// 排除标题含这些词的（套餐/附件/软件/探头等）
const EXCLUDE_TITLE = ["套餐", "套装", "推荐", "选件", "附件", "软件", "探头", "线缆", "衰减", "校准", "机架", "软包", "开关矩阵", "演示板", "参考源", "夹具", "适配器", "同步机", "模块", "插件", "电池", "保护壳", "防护箱", "套件"];
// 系列级：SDS6000 Pro 等系列名（非型号）
const EXCLUDE_MODEL_HAS = ["系列", "选配"];

function isMainInstrument(p) {
  const t = p.title;
  if (EXCLUDE_TITLE.some((w) => t.includes(w))) return false;
  if (EXCLUDE_MODEL_HAS.some((w) => t.includes(w))) return false;
  return true;
}

const filtered = matched.filter(isMainInstrument);
console.log("过滤后:", filtered.length, "/", matched.length);

// 按型号去重（保留第一个）
const seen = new Map();
for (const p of filtered) {
  const key = p.model.replace(/\s+/g, "").toUpperCase();
  if (!seen.has(key)) seen.set(key, p);
}
const unique = [...seen.values()];
console.log("去重后型号数:", unique.length);

// 按系列分布
const bySeries = {};
for (const m of unique) {
  (bySeries[m.series] = bySeries[m.series] || []).push(m);
}
console.log("\n=== 最终型号清单按系列 ===");
for (const [s, list] of Object.entries(bySeries)) {
  console.log(`${s} (${list.length}): ${list.map((m) => m.model).join(", ")}`);
}

fs.writeFileSync("scripts/data/store-final-models.json", JSON.stringify(unique, null, 1));
console.log("\nsaved store-final-models.json, total:", unique.length);
