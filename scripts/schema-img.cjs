const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const img = await c.query(`SELECT COUNT(*) n FROM "Product" WHERE "coverImage" IS NOT NULL AND "coverImage"<>''`);
  console.log("coverImage 非空:", img.rows[0].n);
  const all = await c.query(`SELECT COUNT(*) n FROM "Product"`);
  console.log("总产品:", all.rows[0].n);
  const ex = await c.query(`SELECT model, "coverImage" FROM "Product" WHERE "coverImage" IS NOT NULL AND "coverImage"<>'' LIMIT 8`);
  ex.rows.forEach((x) => console.log("  有图:", x.model, "|", String(x.coverImage).slice(0, 100)));
  // media 表
  const tables = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%media%' OR table_name LIKE '%Media%' OR table_name LIKE '%asset%' OR table_name LIKE '%Asset%')`);
  console.log("\nmedia 相关表:", tables.rows.map((x) => x.table_name).join(", "));
  if (tables.rows.length) {
    const t = tables.rows[0].table_name;
    const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1`, [t]);
    console.log(t, "字段:", cols.rows.map((x) => x.column_name).join(", "));
    const cnt = await c.query(`SELECT COUNT(*) n FROM "${t}"`);
    console.log(t, "记录数:", cnt.rows[0].n);
  }
  await c.end();
})();
