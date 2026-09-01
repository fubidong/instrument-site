const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const r = await c.query(
    `SELECT p.id, p.model FROM "Product" p
     LEFT JOIN "ProductLine" pl ON pl.id = p."productLineId"
     WHERE pl.code ILIKE '%SPD3303X%' ORDER BY p.model LIMIT 2`
  );
  r.rows.forEach((x) => console.log(x.id, "|", x.model));
  await c.end();
});
