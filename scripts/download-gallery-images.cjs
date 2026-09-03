const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { Client } = require("pg");
const dir = "C:/cxy/store-crawl";
const plan = JSON.parse(fs.readFileSync(path.join(dir, "gallery-plan.json"), "utf8"));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const REF = "https://store.siglent.com/";
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const GALLERY_BASE = "E:/cxy/instrument-site/public/uploads/product/gallery";

(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  let ok = 0, fail = 0, items = 0;
  const insertRows = [];
  for (const [model, g2] of Object.entries(plan)) {
    const slug = norm(model);
    const imgs = g2.images; // clean[0]=主图(coverImage已处理), 附加图=imgs[1:]
    const extras = imgs.slice(1);
    if (!extras.length) continue;
    const gdir = path.join(GALLERY_BASE, slug);
    if (!fs.existsSync(gdir)) fs.mkdirSync(gdir, { recursive: true });
    extras.forEach((url, idx) => {
      const target = path.join(gdir, "img" + (idx + 1) + ".jpg");
      try {
        execFileSync("curl.exe", ["-L", "-s", "-A", UA, "-e", REF, url, "-o", target], { timeout: 40000 });
        const size = fs.statSync(target).size;
        if (size > 2000) {
          ok++;
          insertRows.push({ productId: g2.productId, imagePath: `/uploads/product/gallery/${slug}/img${idx + 1}.jpg`, sortOrder: idx + 1 });
        } else { fail++; }
      } catch (e) { fail++; }
      items++;
    });
  }
  console.log("下载附加图 ok:", ok, "fail:", fail);
  // 插入 ProductImage（先清空该品牌旧数据）
  await c.query(`DELETE FROM "ProductImage" WHERE "productId" IN (SELECT id FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT'))`);
  for (const row of insertRows) {
    await c.query(`INSERT INTO "ProductImage" ("id","productId","imagePath","altText","sortOrder") VALUES (gen_random_uuid(),$1,$2,$3,$4)`, [row.productId, row.imagePath, null, row.sortOrder]);
  }
  const cnt = await c.query(`SELECT COUNT(*)::int AS n FROM "ProductImage"`);
  console.log("ProductImage 总条数:", cnt.rows[0].n);
  await c.end();
})();
