const fs = require("fs");
const h = fs.readFileSync("C:/cxy/store-product.html", "utf8");
console.log("len", h.length);
// 产品主图区域（woocommerce 图库通常是 .woocommerce-product-gallery img 或大图）
const bigImgs = h.match(/<img[^>]+(?:class="[^"]*wp-post-image|data-large_image|\.jpg|\.png|\.webp)[^>]*>/g) || [];
console.log("big imgs", bigImgs.length);
bigImgs.slice(0, 12).forEach((i) => {
  const m = i.match(/src="([^"]+)"/);
  const cls = i.match(/class="([^"]*)"/);
  console.log(" ", (m ? m[1] : "?").slice(0, 140), "|", cls ? cls[1].slice(0, 50) : "");
});
// 找所有大图 URL（含 /uploads/ 且非 150x150）
const uploads = h.match(/https:\/\/store\.siglent\.com\/wp-content\/uploads\/[^"'\s)]+/g) || [];
const unique = [...new Set(uploads.filter((u) => !/-150x150/.test(u) && !/\.[a-z]+-1\./.test(u) && !u.endsWith(".svg")))];
console.log("uploads unique", unique.length);
unique.slice(0, 15).forEach((u) => console.log("  ", u.slice(0, 150)));
