const { execFileSync } = require("child_process");
const fs = require("fs");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const REF = "https://store.siglent.com/";
const files = [
  ["SDS6034-H10-Pro-2.jpg", "2025/09"],
  ["1-11.jpg", "2025/09"],
  ["SDM3055-1.jpg", "2025/09"],
  ["SSG5085A-2.jpg", "2025/07"],
  ["1-54.jpg", "2025/09"],
];
let i = 0;
for (const [f, ymd] of files) {
  const url = `https://store.siglent.com/wp-content/uploads/${ymd}/${f}`;
  const out = `C:/cxy/v${i}.jpg`;
  try {
    execFileSync("curl.exe", ["-L", "-s", "-A", UA, "-e", REF, url, "-o", out], { timeout: 30000 });
    const size = fs.statSync(out).size;
    console.log(f, "->", out, size);
  } catch (e) {
    console.log(f, "ERR", String(e.message).slice(0, 100));
  }
  i++;
}
