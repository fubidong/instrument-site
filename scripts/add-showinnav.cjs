const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  await c.query('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "showInNav" BOOLEAN NOT NULL DEFAULT true');
  console.log("showInNav 列已添加");
  const r = await c.query('SELECT "showInNav", count(*) FROM "Category" GROUP BY "showInNav"');
  console.log(r.rows);
  await c.end();
})();
