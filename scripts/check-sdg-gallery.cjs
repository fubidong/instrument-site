const fs = require("fs");
const plan = JSON.parse(fs.readFileSync("C:/cxy/store-crawl/gallery-plan.json", "utf8"));
// 找 SDG1000X 系列 + sds1104x-hd 的图库，看 img7/img4 原文件名
for (const [m, g] of Object.entries(plan)) {
  if (/^SDG(1022|1032|1062)/.test(m) || /^SDS1104X HD$/.test(m)) {
    const imgs = g.images;
    console.log("---", m, "共", imgs.length, "张");
    imgs.forEach((u, i) => console.log("   img" + (i) + ":", u.split("/").pop()));
  }
}
