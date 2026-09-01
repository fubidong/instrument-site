const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`
    SELECT m."sort", m.path, m."brandId", zt.name AS zh, et.name AS en,
           (SELECT name FROM "NavMenuTranslation" t2 WHERE t2."navMenuId"=m."parentId" AND t2.locale='zh') AS parent_zh
    FROM "NavMenu" m
    LEFT JOIN "NavMenuTranslation" zt ON zt."navMenuId"=m.id AND zt.locale='zh'
    LEFT JOIN "NavMenuTranslation" et ON et."navMenuId"=m.id AND et.locale='en'
    ORDER BY m."brandId" NULLS FIRST, m.sort, zt.name
  `);
  r.rows.forEach((x) =>
    console.log(
      (x.brandId ? "[鼎阳]" : "[综合站]").padEnd(8),
      "|", x.parent_zh ? `  └ ${x.parent_zh} / ` : "", x.zh?.padEnd(14), "|", x.en?.padEnd(24), "|", x.path
    )
  );
  await c.end();
})();
