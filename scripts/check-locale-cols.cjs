const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`
    SELECT t.table_name, col.column_name, col.udt_name
    FROM information_schema.columns col
    JOIN information_schema.tables t ON t.table_name = col.table_name AND t.table_schema = col.table_schema
    WHERE col.column_name = 'locale' AND t.table_schema = 'public'
    ORDER BY t.table_name`);
  console.log("locale 列类型:");
  r.rows.forEach((x) => console.log("  ", x.table_name, "->", x.udt_name));
  const e = await c.query("SELECT typname FROM pg_type WHERE typname = 'Locale'");
  console.log("Locale enum 存在:", e.rows.length > 0);
  await c.end();
})();
