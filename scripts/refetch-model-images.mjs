// 重新采集型号主图：cp-detailGallery 第 2 张（跳过广告图）
// 读取已有 model-details.json，重抓每型号 gallery 第 2 张大图
import "dotenv/config";
import fs from "fs";
import path from "path";
import https from "https";
import { TextDecoder } from "util";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "data", "model-details.json");
const IMG_DIR = path.join(__dirname, "..", "public", "uploads", "product", "2026");
fs.mkdirSync(IMG_DIR, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const decoder = new TextDecoder("utf-8");
const DELAY = 200;

function getRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": UA, Referer: "https://store.siglent.com/" } }, (r) => {
      if (r.statusCode === 301 || r.statusCode === 302) { r.resume(); resolve(getRaw(r.headers.location)); return; }
      const chunks = [];
      r.on("data", (c) => chunks.push(c));
      r.on("end", () => resolve({ s: r.statusCode, d: decoder.decode(Buffer.concat(chunks)) }));
    }).on("error", reject);
  });
}

// 提取 cp-detailGallery 第 2 张大图
function gallerySecondImage(html) {
  // 1. cp-detailGallery 容器
  let gIdx = html.indexOf('class="cp-detailGallery"');
  let seg = gIdx >= 0 ? html.slice(gIdx, gIdx + 10000) : html;
  const re = /https:\/\/store\.siglent\.com\/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|png|jpeg)/g;
  const imgs = [...new Set([...seg.matchAll(re)].map((m) => m[0]))].filter((u) => !/150x150|100x100|300x300|32x32|logo|favicon/.test(u));
  if (imgs.length >= 2) return imgs[1]; // 第 2 张
  if (imgs.length === 1) return imgs[0];
  return null;
}

async function download(url, dest) {
  return new Promise((resolve) => {
    https.get(url, { headers: { "User-Agent": UA, Referer: "https://store.siglent.com/" } }, (r) => {
      if (r.statusCode === 301 || r.statusCode === 302) { r.resume(); resolve(download(r.headers.location, dest)); return; }
      const w = fs.createWriteStream(dest);
      r.pipe(w);
      w.on("finish", () => resolve(true));
      w.on("error", () => resolve(false));
    }).on("error", () => resolve(false));
  });
}

const models = JSON.parse(fs.readFileSync(DATA, "utf8"));
console.log("待重抓图片型号:", models.length);

const CONCURRENCY = 6;
let idx = 0;
let okCount = 0;
async function worker() {
  while (idx < models.length) {
    const i = idx++;
    const item = models[i];
    if (item.error) continue;
    try {
      const r = await getRaw(item.link);
      if (r.s !== 200) { console.log(`[${i}] ${item.model} status ${r.s}`); continue; }
      const img = gallerySecondImage(r.d);
      if (!img) { console.log(`[${i}] ${item.model} no gallery`); continue; }
      const ext = path.extname(new URL(img).pathname) || ".jpg";
      const safeModel = item.model.replace(/[^a-zA-Z0-9+\-]/g, "-");
      const fname = `${safeModel}${ext}`;
      const dest = path.join(IMG_DIR, fname);
      // 删除旧图
      try { fs.unlinkSync(dest); } catch {}
      const ok = await download(img, dest);
      if (ok && fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
        item.image = img;
        item.imagePath = `/uploads/product/2026/${fname}`;
        okCount++;
      } else {
        try { fs.unlinkSync(dest); } catch {}
      }
      if ((i + 1) % 20 === 0) { console.log(`[${i + 1}/${models.length}] done`); fs.writeFileSync(DATA, JSON.stringify(models, null, 1)); }
    } catch (e) {
      console.log(`[${i}] ${item.model} ERR ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, DELAY));
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
fs.writeFileSync(DATA, JSON.stringify(models, null, 1));
const finalImg = models.filter((m) => m.imagePath).length;
console.log(`\n完成: 更新 ${okCount} 个图片, 最终有图型号: ${finalImg}/${models.length}`);
console.log("saved model-details.json");
