const { execFileSync } = require("child_process");
const fs = require("fs");
function curl(url, out) { execFileSync("curl.exe", ["-s", "-L", "-o", out, "-A", "Mozilla/5.0", url], { timeout: 30000 }); }
curl("https://store.siglent.com/product/sdg1062x/", "C:/cxy/_g.html");
const h = fs.readFileSync("C:/cxy/_g.html", "utf8");
const gi = h.indexOf('woocommerce-product-gallery');
console.log("gallery@", gi);
console.log(h.slice(gi - 200, gi + 3000));
