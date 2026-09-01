const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(
    `SELECT model, "coverImage" FROM "Product"
     WHERE model LIKE 'SDG%' OR model LIKE 'SNA5%' OR model LIKE 'SPS50%'
     ORDER BY model LIMIT 24`
  );
  r.rows.forEach((x) => console.log(x.model.padEnd(16), x.coverImage));
  await c.end();
})();
