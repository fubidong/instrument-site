const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const r = await c.query(
    `SELECT p.id, p.model, pl.code AS line, c.code AS cat FROM "Product" p
     LEFT JOIN "ProductLine" pl ON pl.id = p."productLineId"
     LEFT JOIN "Category" c ON c.id = p."categoryId"
     WHERE p.model = 'SDS1104X-E' OR pl.code ILIKE '%SDS1000X-E%'
     ORDER BY p.model LIMIT 3`
  );
  r.rows.forEach((x) => console.log(x.id, "|", x.model, "|", x.line, "|", x.cat));
  await c.end();
});
