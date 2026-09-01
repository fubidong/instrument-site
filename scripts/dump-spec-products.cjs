const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const r = await c.query(
    `SELECT p.id, p.model, pl.code AS line FROM "Product" p
     LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
     LEFT JOIN "Category" cc ON cc.id=pl."categoryId"
     WHERE cc.code IN ('SIGLENT-SPECTRUM','SIGLENT-VNA') ORDER BY cc.code, p.model`
  );
  r.rows.forEach((x) => console.log(x.id, "|", x.model.padEnd(14), "|", x.line));
  await c.end();
});
