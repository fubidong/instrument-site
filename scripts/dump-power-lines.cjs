const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const r = await c.query(
    `SELECT pl.id, pl.code, pl."categoryId", c.code AS catCode
     FROM "ProductLine" pl LEFT JOIN "Category" c ON c.id = pl."categoryId"
     WHERE c.code ILIKE '%power%' OR c.code ILIKE '%load%' OR c.code ILIKE '%smu%' OR c.code ILIKE '%source%'
     ORDER BY c.code`
  );
  r.rows.forEach((x) => console.log(x.id, "|", x.code, "| cat=" + x.catCode + "(" + x.categoryId + ")"));
  await c.end();
});
