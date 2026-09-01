// 验证官网产品页 og:image 是否干净型号主图
const { execFileSync } = require("child_process");
const fs = require("fs");
function curl(url, out) { execFileSync("curl.exe", ["-s", "-L", "-o", out, "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "--max-time", "25", url], { timeout: 35000 }); }
function getOg(url) {
  try {
    curl(url, "C:/cxy/_og.html");
    const h = fs.readFileSync("C:/cxy/_og.html", "utf8");
    const og = (h.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || "";
    const title = (h.match(/<title>([^<]+)<\/title>/) || [])[1] || "";
    return { og, title, len: h.length };
  } catch (e) { return { og: "", title: "", len: 0, err: String(e).slice(0, 50) }; }
}
// 官网产品页 URL 变体
const urls = {
  "SDS1104X-E": ["https://www.siglent.com/in/products-overview/sds1104x-e/", "https://www.siglent.com/products/oscilloscopes/sds1104x-e/"],
  "SDG1062X": ["https://www.siglent.com/in/products-overview/sdg1062x/", "https://www.siglent.com/products/function-arbitrary-waveform-generators/sdg1062x/"],
  "SPS5041X": ["https://www.siglent.com/in/products-overview/sps5041x/"],
  "SDS802X-HD": ["https://www.siglent.com/in/products-overview/sds802x-hd/"],
};
for (const [m, us] of Object.entries(urls)) {
  for (const u of us) {
    const { og, title, len, err } = getOg(u);
    console.log(m.padEnd(14), "| len", len, "|", u.slice(28));
    console.log("   og:", og.slice(0, 100));
    if (err) console.log("   err:", err);
  }
}
