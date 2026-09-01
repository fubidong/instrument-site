const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const r = await c.query(
    `SELECT id, code, "brandId", "siteCategoryId" FROM "Category"
     WHERE code ILIKE '%power%' OR code ILIKE '%ps%' OR code ILIKE '%supply%' OR code ILIKE '%load%' OR code ILIKE '%smu%'
     ORDER BY code`
  );
  r.rows.forEach((x) => console.log(x.id, "|", x.code, "| brand=" + (x.brandId || "-"), "| site=" + (x.siteCategoryId || "-")));
  await c.end();
});
