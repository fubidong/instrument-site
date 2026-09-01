const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`UPDATE "ParamDefinition" SET "isFilterable"=false WHERE key='realTimeBW'`);
  console.log("realTimeBW disabled on", r.rowCount, "defs");
  await c.end();
})();
