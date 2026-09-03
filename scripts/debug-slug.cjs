const fs = require("fs");
const path = require("path");
const dir = "C:/cxy/store-crawl";
const g = JSON.parse(fs.readFileSync(path.join(dir, "galleries.json"), "utf8"));
const prods = JSON.parse(fs.readFileSync(path.join(dir, "products.json"), "utf8"));
// 调试 p0 和 sds5034x-hd 页
[0, 1, 2, 3, 40, 41, 42].forEach((idx) => {
  const url = prods[idx];
  const slugRaw = decodeURIComponent((url.split("/product/")[1] || "").split("/")[0] || "");
  console.log("p" + idx, "slug:", slugRaw);
  console.log("   ascii:", slugRaw.replace(/[^\x00-\x7f]/g, ""), "| len:", slugRaw.replace(/[^\x00-\x7f]/g, "").length);
  const files = g["p" + idx + ".html"];
  console.log("   gallery:", files.length, files.slice(0, 3).map((u) => u.split("/").pop().replace(/"/g, "")));
});
// 找包含 sds6034 的页
console.log("--- 含 sds6034 的产品 URL ---");
prods.forEach((u, i) => {
  if (/sds6034/i.test(u)) console.log("p" + i, u.split("/product/")[1].split("/")[0]);
});
