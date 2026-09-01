const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(
    `SELECT p.id, p.model, pl.code AS line FROM "Product" p
     LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
     LEFT JOIN "Category" cc ON cc.id=pl."categoryId"
     WHERE cc.code='SIGLENT-RF-GEN' ORDER BY p.model`
  );
  r.rows.forEach((x) => console.log(x.id, "|", x.model.padEnd(16), "|", x.line));
  await c.end();
})();
