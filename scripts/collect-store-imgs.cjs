// 从 store.siglent.com 采集各型号主图（详情页 og:image），下载到本地并更新 coverImage
const { Client } = require("pg");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT_DIR = "E:\\cxy\\instrument-site\\public\\uploads\\product\\2026";

function slugify(m) {
  return m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function fetchOg(model) {
  const slug = slugify(model);
  const url = `https://store.siglent.com/product/${slug}/`;
  const tmp = "C:\\cxy\\_probe_tmp.html";
  try {
    execFileSync("curl.exe", ["-s", "-L", "-o", tmp, "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "--max-time", "20", url], { timeout: 30000 });
    const h = fs.readFileSync(tmp, "utf8");
    const og = h.match(/<meta property="og:image" content="([^"]+)"/);
    const title = (h.match(/<title>([^<]+)<\/title>/) || [])[1] || "";
    return { og: og ? og[1] : null, title, slug };
  } catch (e) {
    return { og: null, title: "", slug, err: String(e).slice(0, 60) };
  }
}

function matchesTitle(model, title) {
  // 标题应包含型号主体（容错空格/大小写/连字符）
  const m = model.toLowerCase().replace(/\s+/g, "").replace(/\+/g, "").replace(/-/g, "");
  const t = title.toLowerCase().replace(/\s+/g, "").replace(/\+/g, "").replace(/-/g, "");
  return t.includes(m) || m.includes(t.split("高分辨率")[0].replace(/\d+位.*$/, ""));
}

async function download(url, dest) {
  try {
    execFileSync("curl.exe", ["-s", "-L", "-o", dest, "--max-time", "30", url], { timeout: 40000 });
    return fs.existsSync(dest) && fs.statSync(dest).size > 1000;
  } catch (e) {
    return false;
  }
}

(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT id, model, "coverImage" FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT') ORDER BY model`);
  const products = r.rows;
  console.log("共", products.length, "款");

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0, miss = 0, kept = 0, skipped = 0;
  const missList = [];
  const CONC = 5;
  let idx = 0;

  async function worker() {
    while (idx < products.length) {
      const i = idx++;
      const p = products[i];
      const { og, title, slug, err } = await fetchOg(p.model);
      if (!og) {
        miss++; missList.push(`${p.model} | 无og:image ${err || ""} | title=${title.slice(0,30)}`);
        continue;
      }
      // 校验型号匹配
      const m = p.model.toLowerCase();
      const t = title.toLowerCase();
      if (!(t.includes(slugify(m)) || t.includes(m.replace(/\s+/g, "")))) {
        // 容错：标题可能是变体（如 PLUS vs Plus）
        const core = m.replace(/[^a-z0-9]/g, "");
        if (!t.replace(/[^a-z0-9]/g, "").includes(core)) {
          miss++; missList.push(`${p.model} | title 不匹配: ${title.slice(0,40)}`);
          continue;
        }
      }
      // 下载主图（去 og:image 尺寸后缀）
      let src = og;
      if (/-150x150/.test(src)) src = src.replace(/-150x150.*\.(jpg|jpeg|png|webp)$/, ".$1");
      const ext = (src.match(/\.(jpg|jpeg|png|webp)/) || [".jpg"])[1];
      const fname = `${slugify(p.model)}.${ext === "jpeg" ? "jpg" : ext === "webp" ? "jpg" : ext}`;
      const dest = path.join(OUT_DIR, fname);
      const dlOk = await download(src, dest);
      if (dlOk) {
        const rel = `/uploads/product/2026/${fname}`;
        await c.query(`UPDATE "Product" SET "coverImage"=$1, "updatedAt"=now() WHERE id=$2`, [rel, p.id]);
        ok++;
        console.log("✓", p.model.padEnd(18), "->", fname);
      } else {
        miss++; missList.push(`${p.model} | 下载失败 ${src.slice(0,60)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  console.log("\n结果: 更新", ok, "款 / 缺失", miss, "款 / 保留", kept, "款");
  console.log("\n缺失清单:");
  missList.forEach((x) => console.log("  ", x));
  await c.end();
})();
