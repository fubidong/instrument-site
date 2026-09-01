const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query("SELECT column_name,data_type,column_default FROM information_schema.columns WHERE table_name='Category' ORDER BY ordinal_position");
  console.log("Category 表字段:");
  r.rows.forEach((x) => console.log(" ", x.column_name, "|", x.data_type, "|", x.column_default ?? ""));
  await c.end();
})();
