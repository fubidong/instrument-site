// 提取 store 详情页 JSON-LD Product 数据的 image 数组
const { execFileSync } = require("child_process");
const fs = require("fs");
function curl(url, out) { execFileSync("curl.exe", ["-s", "-L", "-o", out, "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "--max-time", "25", url], { timeout: 35000 }); }
const m = "SDG1062X";
const slug = m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
curl(`https://store.siglent.com/product/${slug}/`, "C:/cxy/_j.html");
const h = fs.readFileSync("C:/cxy/_j.html", "utf8");
// 提取所有 JSON-LD
const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let mm, n = 0;
while ((mm = re.exec(h))) {
  n++;
  console.log("--- JSON-LD", n, "len", mm[1].length);
  const seg = mm[1];
  if (seg.includes("image") || seg.includes("Image") || seg.includes("Product")) {
    console.log(seg.slice(0, 1500).replace(/\s+/g, " "));
    if (n >= 4) break;
  }
}
if (n === 0) console.log("无 JSON-LD");
