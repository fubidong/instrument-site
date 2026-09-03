const fs = require("fs");
const path = require("path");
const dir = "C:/cxy/store-crawl";
const g = JSON.parse(fs.readFileSync(path.join(dir, "galleries.json"), "utf8"));
const keys = Object.keys(g);
console.log("产品页数:", keys.length);
const countDist = {};
keys.forEach((k) => {
  const n = g[k].length;
  countDist[n] = (countDist[n] || 0) + 1;
});
console.log("图库图片数分布:", JSON.stringify(countDist));
// 抽样 3 个图库
let shown = 0;
for (const k of keys) {
  if (shown >= 3) break;
  console.log("---", k, "图库数", g[k].length);
  g[k].forEach((u) => console.log("   ", u.replace("https://store.siglent.com/wp-content/uploads/", "")));
  shown++;
}
// 全部图片文件名统计
const names = {};
Object.values(g).forEach((arr) => arr.forEach((u) => {
  const f = u.split("/").pop();
  names[f] = (names[f] || 0) + 1;
}));
console.log("唯一文件名:", Object.keys(names).length);
// 广告图统计（含-1 或促销关键词）
const promo = Object.keys(names).filter((f) => /-1(?=\.)|-1\b/.test(f) || /promo|sale|discount/i.test(f));
console.log("疑似广告(-1或promo):", promo.length);
promo.slice(0, 20).forEach((f) => console.log("   ", f));
