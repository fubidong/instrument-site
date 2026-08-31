// 采集鼎阳官网全量产品数据（从 filter 页 SSR 内嵌的 window 变量）
// 输出 scripts/data/siglent-raw.json
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const URLS = [
  "https://www.siglent.com/products/oscilloscope/filter/",
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetch(res.headers.location));
      }
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    }).on("error", reject);
  });
}

function extractVar(body, name) {
  // 找 window.xxx = {...} 或 [...] 的 JS 赋值
  const idx = body.indexOf(`window.${name} = `);
  if (idx < 0) return null;
  // 从等号后开始解析 JSON（对象/数组）
  let start = idx + `window.${name} = `.length;
  let first = body[start];
  let end = -1;
  if (first === "{" || first === "[") {
    const open = first;
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < body.length; i++) {
      const ch = body[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) { end = i + 1; break; }
      }
    }
  }
  if (end < 0) return null;
  try {
    return JSON.parse(body.slice(start, end));
  } catch (e) {
    console.log("parse fail for", name, e.message);
    return null;
  }
}

async function main() {
  const out = {};
  for (const url of URLS) {
    console.log("fetching", url);
    const { status, body } = await fetch(url);
    console.log("status", status, "len", body.length);
    if (status !== 200) continue;
    const dataMap = extractVar(body, "productIdDataMap");
    const sorted = extractVar(body, "sortedProductIds");
    const catMap = extractVar(body, "productCategoryIdDataMap");
    const prodMap = extractVar(body, "productCategoryIdProductsMap");
    const attrMap = extractVar(body, "productAttributeIdDataMap");
    out.dataMap = dataMap;
    out.sortedIds = sorted;
    out.categoryMap = catMap;
    out.categoryProductsMap = prodMap;
    out.attributeMap = attrMap;
    console.log("products:", sorted ? sorted.length : 0, "cats:", catMap ? Object.keys(catMap).length : 0);
    break; // 一个页面就够
  }
  const dir = path.join(__dirname, "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "siglent-raw.json"), JSON.stringify(out));
  console.log("saved siglent-raw.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
