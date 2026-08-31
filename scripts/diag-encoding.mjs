// 诊断 store HTML 编码
import https from "https";
import { TextDecoder } from "util";

function getRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }, (r) => {
      const chunks = [];
      r.on("data", (c) => chunks.push(c));
      r.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

const buf = await getRaw("https://store.siglent.com/product/sds6104-h10-pro-%e9%ab%98%e5%88%86%e8%be%a8%e7%8e%87%e7%a4%ba%e6%b3%a2%e5%99%a8/");
console.log("buffer len:", buf.length);
// 检查 charset 声明
const head = buf.slice(0, 2000).toString("utf8");
const cs = head.match(/charset=["']?([^"';\s>]+)/i);
console.log("charset declared:", cs ? cs[1] : "none");

// 尝试 utf8 解码 cp-excerpt 附近
const utf8 = new TextDecoder("utf-8").decode(buf);
const idx = utf8.indexOf("cp-excerpt");
console.log("utf8 cp-excerpt found:", idx >= 0);
if (idx >= 0) console.log("utf8 snippet:", utf8.slice(idx, idx + 200).replace(/<[^>]+>/g, " "));

// 尝试 gbk 解码
try {
  const { TextDecoder: TD } = await import("util");
  // node 需要 iconv 支持 gbk，试试看
} catch {}
