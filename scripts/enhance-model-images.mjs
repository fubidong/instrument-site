// 增强：型号图优先匹配文件名含型号的干净图，否则用 gallery 第 2 张
import fs from "fs";
import path from "path";
import https from "https";
import { TextDecoder } from "util";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "data", "model-details.json");
const IMG_DIR = path.join(__dirname, "..", "public", "uploads", "product", "2026");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const decoder = new TextDecoder("utf-8");
const DELAY = 150;

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

// 归一化：大写 + 去非字母数字
const norm = (s) => s.toUpperCase().replace(/[^A-Z0-9+]/g, "");
const normFile = (f) => norm(f).replace(/\.(JPG|PNG|JPEG)$/, "");
// 附件/广告关键词（图文件名含则排除）
const BAD_RE = /USB|MOUSE|CABLE|PROBE|线缆|探头|附件|POWER-CORD|手册|文件|BAG|SLA|DF20|STB|对比|KEYBOARD|MOUNT|RACK|选件|套餐|套装|标配|校准|ACC|LOGO|-1\.(jpg|png|jpeg)$/i;

function galleryImages(html) {
  let gIdx = html.indexOf('class="cp-detailGallery"');
  let seg = gIdx >= 0 ? html.slice(gIdx, gIdx + 12000) : html;
  const re = /https:\/\/store\.siglent\.com\/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|png|jpeg)/g;
  return [...new Set([...seg.matchAll(re)].map((m) => m[0]))].filter((u) => !/150x150|100x100|300x300|32x32|favicon/.test(u));
}

function pickMainImage(imgs, modelNorm) {
  // 排除明显附件图
  const cands = imgs.filter((u) => !BAD_RE.test(decodeURIComponent(u.split("/").pop())));
  // 1. 文件名含型号名（精确归一化匹配），无后缀优先
  const exact = cands.find((u) => normFile(decodeURIComponent(u.split("/").pop())) === modelNorm);
  if (exact) return exact;
  // 2. 文件名含型号名 + 数字后缀（排除 -1，-1 是广告）
  const withSuffix = cands.find((u) => {
    const nf = normFile(decodeURIComponent(u.split("/").pop()));
    if (!nf.startsWith(modelNorm) && !nf.includes(modelNorm)) return false;
    const m = nf.slice(modelNorm.length);
    return /^-\d+$/.test(m) && m !== "-1"; // 数字后缀且非 -1
  });
  if (withSuffix) return withSuffix;
  // 3. 兜底：gallery 第 2 张（跳过第一张广告）
  if (imgs.length >= 2) return imgs[1];
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
const CONCURRENCY = 6;
let idx = 0;
let changed = 0;

async function worker() {
  while (idx < models.length) {
    const i = idx++;
    const item = models[i];
    if (item.error) continue;
    try {
      const r = await getRaw(item.link);
      if (r.s !== 200) continue;
      const imgs = galleryImages(r.d);
      const modelNorm = norm(item.model);
      const picked = pickMainImage(imgs, modelNorm);
      if (!picked) continue;
      const pickedFile = decodeURIComponent(picked.split("/").pop()).toUpperCase();
      const curFile = item.image ? decodeURIComponent(item.image.split("/").pop()).toUpperCase() : "";
      // 当前图文件名已含型号名 → 跳过（已达标）
      if (curFile && normFile(curFile).includes(modelNorm)) continue;
      const ext = path.extname(new URL(picked).pathname) || ".jpg";
      const safeModel = item.model.replace(/[^a-zA-Z0-9+\-]/g, "-");
      const fname = `${safeModel}${ext}`;
      const dest = path.join(IMG_DIR, fname);
      try { fs.unlinkSync(dest); } catch {}
      const ok = await download(picked, dest);
      if (ok && fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
        item.image = picked;
        item.imagePath = `/uploads/product/2026/${fname}`;
        changed++;
        console.log(`[${i}] ${item.model}: ${picked.split("/").pop()}  <- was ${curFile || "none"}`);
      } else {
        try { fs.unlinkSync(dest); } catch {}
      }
    } catch (e) {}
    await new Promise((r) => setTimeout(r, DELAY));
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
fs.writeFileSync(DATA, JSON.stringify(models, null, 1));
console.log(`\n完成: 更新 ${changed} 个型号图片`);
