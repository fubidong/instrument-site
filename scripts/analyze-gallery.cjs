const fs = require("fs");
const h = fs.readFileSync("C:/cxy/store-product.html", "utf8");
// 找产品主图区域：woocommerce 或常见图库类名容器
const galClasses = h.match(/<div[^>]+class="[^"]*(?:gallery|product-image|product-img|slider|swiper|bigimage|big-pic|mainimg|pro-img|product_detail_img)[^"]*"/gi) || [];
console.log("图库容器:", galClasses.length);
galClasses.slice(0, 15).forEach((c) => console.log("  ", c.slice(0, 150)));
// 找图片容器（img 的父标签）
const imgWrappers = h.match(/<(?:div|li|a)[^>]+class="[^"]*(?:gallery|thumb|slider|swiper|product)[^"]*"[^>]*>\s*<img/g) || [];
console.log("img容器:", imgWrappers.length);
imgWrappers.slice(0, 10).forEach((c) => console.log("  ", c.slice(0, 160)));
// 检查主图附近：SDS6034-H10-Pro-1.jpg 在 HTML 中出现的上下文
const idx = h.indexOf("SDS6034-H10-Pro-1.jpg");
if (idx > -1) {
  console.log("--- 主图上下文 ---");
  console.log(h.slice(idx - 700, idx + 200).replace(/\s+/g, " ").slice(0, 900));
}
