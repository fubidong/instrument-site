const { execFileSync } = require("child_process");
const fs = require("fs");
function curl(url, out) { execFileSync("curl.exe", ["-s", "-L", "-o", out, "-A", "Mozilla/5.0", url], { timeout: 30000 }); }
for (const m of ["SDG1062X", "SNA5006X-E"]) {
  const slug = m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  curl(`https://store.siglent.com/product/${slug}/`, "C:/cxy/_g.html");
  const h = fs.readFileSync("C:/cxy/_g.html", "utf8");
  console.log("###", m);
  // data-large_image / data-thumb / woocommerce-product-gallery__image
  const pats = [
    ["data-large_image=", /data-large_image="([^"]+)"/g],
    ["data-thumb=", /data-thumb="([^"]+)"/g],
    ["__image", /woocommerce-product-gallery__image[^>]*>/g],
    ["data-src=", /data-src="([^"]+)"/g],
  ];
  for (const [name, re] of pats) {
    const found = [...h.matchAll(re)].map((x) => x[1] || x[0]).slice(0, 6);
    if (found.length) {
      console.log(`  ${name}:`);
      found.forEach((x) => console.log("    ", x.slice(0, 130)));
    }
  }
  // 找 JS gallery 数组
  const jsRe = /(?:images|gallery|photos)\s*[:=]\s*\[([\s\S]{0,800}?)\]/;
  const jm = h.match(jsRe);
  if (jm) console.log("  JS数组片段:", jm[1].slice(0, 400).replace(/\s+/g, " "));
}
