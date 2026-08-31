// 采集鼎阳型号级数据：详情页参数 + 干净主图（修复版：UTF-8 + 图片匹配）
// 输入: store-final-models.json (228 型号)
// 输出: scripts/data/model-details.json + 图片下载到 public/uploads/product/2026/
import "dotenv/config";
import fs from "fs";
import path from "path";
import https from "https";
import { TextDecoder } from "util";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const models = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "store-final-models.json"), "utf8"));
const OUT = path.join(__dirname, "data", "model-details.json");
const IMG_DIR = path.join(__dirname, "..", "public", "uploads", "product", "2026");
fs.mkdirSync(IMG_DIR, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const DELAY = 250;
const decoder = new TextDecoder("utf-8");

function getRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": UA, Referer: "https://store.siglent.com/" } }, (r) => {
      if (r.statusCode === 301 || r.statusCode === 302) {
        r.resume();
        resolve(getRaw(r.headers.location));
        return;
      }
      const chunks = [];
      r.on("data", (c) => chunks.push(c));
      r.on("end", () => resolve({ s: r.statusCode, d: decoder.decode(Buffer.concat(chunks)) }));
    }).on("error", reject);
  });
}

// 提取 .cp-excerpt 参数
function extractParams(html) {
  const m = html.match(/class="cp-excerpt"[^>]*>([\s\S]*?)<\/div>/);
  if (!m) return [];
  const text = m[1].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const params = [];
  for (const line of lines) {
    const colon = line.indexOf("：");
    if (colon > 0) {
      const name = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();
      if (name && value && name.length < 30) params.push({ name, value });
    } else {
      if (line.length > 8 && line.length < 60) params.push({ name: "特性", value: line });
    }
  }
  return params;
}

// 附件/非产品图排除
const ATTACH_RE = /usb|鼠标|mouse|cable|线|adapter|适配|探头|probe|logo|icon|favicon|ocxo|fx-|sp61|sp30|sp50|cp40|cp60|cp65|scp|sap|dpb|hpb|pp3|db-|sma-|pa-kit/i;

// 提取 gallery 大图，选干净主图
function extractMainImage(html, model) {
  const imgs = [...html.matchAll(/https:\/\/store\.siglent\.com\/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|png|jpeg)/g)].map((m) => m[0]);
  const uniq = [...new Set(imgs)].filter((u) => !/150x150|100x100|300x300|32x32/.test(u));
  if (uniq.length === 0) return null;

  const normModel = model.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  // 文件名归一化：去空格/连字符/下划线/后缀
  const normFile = (u) => u.split("/").pop().replace(/\.(jpg|jpeg|png)$/i, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  // 1. 型号名精确匹配（-2 优先 = 干净主图）
  const candidates = uniq.filter((u) => {
    const f = normFile(u);
    return f === normModel || f === normModel + "2" || f === normModel + "1" || f.startsWith(normModel);
  });
  // 在候选里优先 -2 或无 -1 后缀
  const m2 = candidates.find((u) => /-2(?:-\d+)?\.(jpg|png)$/i.test(u) || normFile(u) === normModel + "2");
  const mclean = candidates.find((u) => !/-1\.(jpg|png)$/i.test(u) && !ATTACH_RE.test(u));
  const pick = m2 || mclean || candidates[0] || null;
  if (pick) return pick;

  // 2. 无型号匹配 → 系列图（含系列名）
  return null;
}

async function download(url, dest) {
  return new Promise((resolve) => {
    https.get(url, { headers: { "User-Agent": UA, Referer: "https://store.siglent.com/" } }, (r) => {
      if (r.statusCode === 301 || r.statusCode === 302) {
        r.resume();
        resolve(download(r.headers.location, dest));
        return;
      }
      const w = fs.createWriteStream(dest);
      r.pipe(w);
      w.on("finish", () => resolve(true));
      w.on("error", () => resolve(false));
    }).on("error", () => resolve(false));
  });
}

// 断点续传
let results = [];
if (fs.existsSync(OUT)) {
  try { results = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { results = []; }
}
const done = new Set(results.filter((r) => !r.error).map((r) => r.model));
const todo = models.filter((m) => !done.has(m.model));
console.log(`总型号: ${models.length}, 已完成: ${done.size}, 待采集: ${todo.length}`);

const CONCURRENCY = 6;
let idx = 0;
async function worker() {
  while (idx < todo.length) {
    const i = idx++;
    const item = todo[i];
    const model = item.model;
    try {
      const r = await getRaw(item.link);
      if (r.s !== 200) {
        results.push({ model, series: item.series, line: item.line, error: `status ${r.s}` });
        fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
        console.log(`[${i + 1}/${todo.length}] ${model} ERROR ${r.s}`);
        continue;
      }
      const params = extractParams(r.d);
      const img = extractMainImage(r.d, model);
      let imagePath = null;
      if (img) {
        const ext = path.extname(new URL(img).pathname) || ".jpg";
        const safeModel = model.replace(/[^a-zA-Z0-9+\-]/g, "-");
        const fname = `${safeModel}${ext}`;
        const dest = path.join(IMG_DIR, fname);
        const ok = await download(img, dest);
        if (ok && fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
          imagePath = `/uploads/product/2026/${fname}`;
        } else {
          try { fs.unlinkSync(dest); } catch {}
        }
      }
      results.push({ model, series: item.series, line: item.line, title: item.title, params, image: img, imagePath, link: item.link });
      if ((i + 1) % 15 === 0) console.log(`[${i + 1}/${todo.length}] ${model} params=${params.length} img=${imagePath ? "ok" : "none"}`);
      fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
    } catch (e) {
      results.push({ model, series: item.series, line: item.line, error: e.message });
      fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
      console.log(`[${i + 1}/${todo.length}] ${model} ERR ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, DELAY));
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
const okCount = results.filter((r) => !r.error && r.params.length > 0).length;
console.log(`\n采集完成: ${results.length}, 有参数: ${okCount}, 图片: ${results.filter((r) => r.imagePath).length}`);
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
console.log("saved model-details.json");
