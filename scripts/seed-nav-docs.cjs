// 补充综合站导航：资料下载（若不存在）
const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const crypto = require("crypto");
  const exist = await c.query(`SELECT COUNT(*)::int AS n FROM "NavMenu" m WHERE m."brandId" IS NULL AND m.path='/documents'`);
  if (exist.rows[0].n === 0) {
    const id = crypto.randomUUID();
    await c.query(
      `INSERT INTO "NavMenu" ("id","parentId","icon","path","sort","isVisible","isExternal","target","platform","brandId")
       VALUES ($1,NULL,'📄','/documents',3,true,false,'_self','web',NULL)`,
      [id]
    );
    await c.query(
      `INSERT INTO "NavMenuTranslation" ("id","navMenuId","locale","name") VALUES ($1,$2,'zh',$3),($4,$2,'en',$5)`,
      [crypto.randomUUID(), id, "资料下载", crypto.randomUUID(), "Resources"]
    );
    // 把原"品牌"排序 3 改为 2，产品中心 2 改为 1？不需要，直接用 sort 顺序：首页1 产品中心2 资料下载3 品牌4 联系5
    // 更新现有综合站顶级菜单 sort：品牌→4，联系→5（资料下载已占 3）
    await c.query(`UPDATE "NavMenu" SET "sort"=4 WHERE "brandId" IS NULL AND path='/brands'`);
    await c.query(`UPDATE "NavMenu" SET "sort"=5 WHERE "brandId" IS NULL AND path='/contact'`);
    console.log("已补充 资料下载 到综合站导航");
  } else {
    console.log("资料下载已存在");
  }
  const r = await c.query(`SELECT m.path, m."sort", t.name FROM "NavMenu" m LEFT JOIN "NavMenuTranslation" t ON t."navMenuId"=m.id AND t.locale='zh' WHERE m."brandId" IS NULL AND m."parentId" IS NULL ORDER BY m.sort`);
  r.rows.forEach((x) => console.log(" ", x.sort, x.path, x.name));
  await c.end();
})();
