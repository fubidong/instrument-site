const { execFileSync } = require("child_process");
try {
  const out = execFileSync("curl.exe", ["-L", "-s", "-A", "Mozilla/5.0", "https://store.siglent.com/shop/?category=21&subcategory=23&series=355", "-o", "C:/cxy/execfile-test.html"], { timeout: 30000, encoding: "utf8" });
  console.log("OK out:", String(out).slice(0, 200));
} catch (e) {
  console.log("ERR msg:", String(e.message).slice(0, 400));
  console.log("ERR stderr:", String(e.stderr).slice(0, 300));
  console.log("ERR code:", e.status, e.signal);
}
const fs = require("fs");
try {
  const st = fs.statSync("C:/cxy/execfile-test.html");
  console.log("file size", st.size);
} catch (e) {
  console.log("no file");
}
