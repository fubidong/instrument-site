const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const r = await c.query(
    `SELECT pl.code, c.code AS cat, c."parentId", c."brandId" FROM "ProductLine" pl
     LEFT JOIN "Category" c ON c.id = pl."categoryId"
     WHERE pl.code ILIKE '%SDS%' ORDER BY pl.code`
  );
  r.rows.forEach((x) => console.log(x.code.padEnd(14), "| cat=" + x.cat, "| parent=" + x.parentId, "| brand=" + x.brandId));
  await c.end();
});
