// 导航菜单初始数据：综合站 + 鼎阳品牌站（参数化查询）
const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();

  const existing = await c.query(`SELECT COUNT(*)::int AS n FROM "NavMenu"`);
  if (existing.rows[0].n > 0) {
    console.log("NavMenu 已有数据，跳过 seed");
    await c.end();
    return;
  }

  const slug = (code) => code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const crypto = require("crypto");
  const uuid = () => crypto.randomUUID();

  const brand = await c.query(`SELECT id FROM "Brand" WHERE code='SIGLENT'`);
  const siglentId = brand.rows[0]?.id || null;

  const globalCats = await c.query(`
    SELECT cat.code, zt.name AS zh, et.name AS en
    FROM "Category" cat
    LEFT JOIN "CategoryTranslation" zt ON zt."categoryId"=cat.id AND zt.locale='zh'
    LEFT JOIN "CategoryTranslation" et ON et."categoryId"=cat.id AND et.locale='en'
    WHERE cat."brandId" IS NULL AND cat."parentId" IS NULL
    ORDER BY cat."sortOrder", cat.code
  `);

  const brandCats = siglentId ? await c.query(`
    SELECT cat.code, zt.name AS zh, et.name AS en
    FROM "Category" cat
    LEFT JOIN "CategoryTranslation" zt ON zt."categoryId"=cat.id AND zt.locale='zh'
    LEFT JOIN "CategoryTranslation" et ON et."categoryId"=cat.id AND et.locale='en'
    WHERE cat."brandId"=$1 AND cat."parentId" IS NULL
    ORDER BY cat."sortOrder", cat.code
  `, [siglentId]) : { rows: [] };

  async function insert(parentId, icon, path, sort, isVisible, brandId, zh, en) {
    const id = uuid();
    await c.query(
      `INSERT INTO "NavMenu" ("id","parentId","icon","path","sort","isVisible","isExternal","target","platform","brandId")
       VALUES ($1,$2,$3,$4,$5,$6,false,'_self','web',$7)`,
      [id, parentId, icon, path, sort, isVisible, brandId]
    );
    await c.query(
      `INSERT INTO "NavMenuTranslation" ("id","navMenuId","locale","name") VALUES ($1,$2,'zh',$3),($4,$2,'en',$5)`,
      [uuid(), id, zh, uuid(), en]
    );
    return id;
  }

  // ===== 综合站导航（brandId=null） =====
  await insert(null, "🏠", "/", 1, true, null, "首页", "Home");
  const gProducts = await insert(null, "📦", "/products", 2, true, null, "产品中心", "Products");
  globalCats.rows.forEach((cat, i) => {
    insert(gProducts, null, `/products?category=${cat.code}`, i + 1, true, null, cat.zh || cat.code, cat.en || cat.code);
  });
  await insert(null, "🏷", "/brands", 3, true, null, "品牌", "Brands");
  await insert(null, "✉️", "/contact", 4, true, null, "联系我们", "Contact");

  // ===== 鼎阳品牌站导航（brandId=siglent） =====
  if (siglentId) {
    await insert(null, "🏠", "/", 1, true, siglentId, "首页", "Home");
    const bProducts = await insert(null, "📦", "/category", 2, true, siglentId, "产品中心", "Products");
    brandCats.rows.forEach((cat, i) => {
      insert(bProducts, null, `/category/${slug(cat.code)}`, i + 1, true, siglentId, cat.zh || cat.code, cat.en || cat.code);
    });
    await insert(null, "✉️", "/contact", 3, true, siglentId, "联系我们", "Contact");
  }

  const cnt = await c.query(`SELECT COUNT(*)::int AS n FROM "NavMenu"`);
  console.log("seed 完成，NavMenu 共", cnt.rows[0].n, "条");
  await c.end();
})();
