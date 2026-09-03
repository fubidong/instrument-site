const fs = require("fs");
const plan = JSON.parse(fs.readFileSync("C:/cxy/store-crawl/gallery-plan.json", "utf8"));
// 配件关键词（中文+英文）
const accKW = /电源线缆|鳄鱼夹|香蕉|探头|线缆|测试线|表笔|适配器|转接头|保险丝|软件|注册|证书|手册|保修|校准|Software|Access|Accessory|Driver|Manual|Certificate|Calibrat|Probe|Cable|Lead|Adapter|Fuse/i;
const found = {};
for (const [m, g] of Object.entries(plan)) {
  g.images.forEach((u, i) => {
    const fn = u.split("/").pop();
    if (accKW.test(fn)) {
      const key = fn;
      found[key] = found[key] || [];
      found[key].push({ model: m, idx: i });
    }
  });
}
console.log("疑似配件图文件名:", Object.keys(found).length);
for (const [k, list] of Object.entries(found)) {
  console.log("  ", k, "->", list.length, "处");
  list.slice(0, 8).forEach((x) => console.log("       ", x.model, "img" + x.idx));
}
