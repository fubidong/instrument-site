const fs = require("fs");
const h = fs.readFileSync("C:/cxy/store-product.html", "utf8");
// 提取 cp-detailGallery 块
const start = h.indexOf("cp-detailGallery");
if (start > -1) {
  const block = h.slice(start, start + 8000);
  const imgs = block.match(/src="([^"]+)"/g) || [];
  console.log("图库图片数:", imgs.length);
  imgs.forEach((i) => console.log("  ", i.replace('src="', "").slice(0, 140)));
  // 缩略图块
  const tstart = block.indexOf("swiper-thumbs") > -1 ? block.indexOf("swiper-thumbs") : -1;
  if (tstart > -1) {
    const tblock = h.slice(tstart, tstart + 5000);
    const timgs = tblock.match(/src="([^"]+)"/g) || [];
    console.log("缩略图:", timgs.length);
    timgs.slice(0, 12).forEach((i) => console.log("   ", i.replace('src="', "").slice(0, 140)));
  }
} else {
  console.log("no cp-detailGallery");
}
