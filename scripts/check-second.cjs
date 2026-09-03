const fs = require("fs");
const path = require("path");
const dir = "C:/cxy/store-crawl";
const g = JSON.parse(fs.readFileSync(path.join(dir, "galleries.json"), "utf8"));
// 检查每页图库第1张、第2张的文件名，识别配件/注册图
const patterns = /^(SP[0-9]|HP[0-9]|PB[0-9]|PP[0-9]|TP[0-9]|AT[0-9]|CS[0-9]|SC[0-9]|ST[0-9]|注册|证书|手册|Software|软件|驱动|Driver|Access)/i;
const rows = [];
Object.keys(g).forEach((k) => {
  const files = g[k].map((u) => u.split("/").pop()).map((f) => f.replace(/"/g, ""));
  const f1 = files[0] || "?";
  const f2 = files[1] || "?";
  const f2IsAcc = patterns.test(f2);
  rows.push({ k, f1: f1.slice(0, 40), f2: f2.slice(0, 40), f2Acc: f2IsAcc });
});
const accCount = rows.filter((r) => r.f2Acc).length;
console.log("第2张是配件/注册图的数量:", accCount);
rows.filter((r) => r.f2Acc).slice(0, 20).forEach((r) => console.log("  ", r.k, "f1:", r.f1, "| f2:", r.f2));
// 第1张分布（是否广告 -1）
const f1ad = rows.filter((r) => /-1(?:\.|$)|-1-/.test(r.f1)).length;
console.log("第1张含-1数量:", f1ad);
// 第2张全是 -1 的（可能是广告）
const f2ad = rows.filter((r) => /-1(?:\.|$)|-1-/.test(r.f2)).length;
console.log("第2张含-1数量:", f2ad);
rows.filter((r) => /-1(?:\.|$)|-1-/.test(r.f2)).slice(0, 10).forEach((r) => console.log("  f2广告:", r.k, r.f1, "|", r.f2));
