const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query("SELECT column_name,data_type,udt_name FROM information_schema.columns WHERE table_name='NavMenuTranslation'");
  console.log(JSON.stringify(r.rows, null, 1));
  const l = await c.query("SELECT DISTINCT locale FROM \"NavMenuTranslation\"");
  console.log("locale 值:", JSON.stringify(l.rows));
  await c.end();
})();
