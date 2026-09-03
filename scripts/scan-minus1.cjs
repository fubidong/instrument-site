const fs = require("fs");
const plan = JSON.parse(fs.readFileSync("C:/cxy/store-crawl/gallery-plan.json", "utf8"));
const minus1 = {};
for (const [m, g] of Object.entries(plan)) {
  g.images.forEach((u, i) => {
    const fn = u.split("/").pop();
    if (/-1(?:\.|$)|-1-/.test(fn)) {
      const key = fn;
      minus1[key] = minus1[key] || [];
      minus1[key].push(m + " img" + i);
    }
  });
}
console.log("含-1文件名:", Object.keys(minus1).length);
for (const [k, list] of Object.entries(minus1)) {
  console.log("  ", k, "->", list.length, "处");
  console.log("       ", list.slice(0, 10).join(", "));
}
