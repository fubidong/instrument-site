const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(
    `SELECT p.model, pl.code AS line, p.id FROM "Product" p
     LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
     WHERE p."brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')
     ORDER BY pl.code, p.model`
  );
  let cur = "";
  let total = 0;
  const lines = {};
  r.rows.forEach((x) => {
    if (x.line !== cur) { cur = x.line; console.log("\n## " + cur); }
    total++;
    lines[x.line] = (lines[x.line] || 0) + 1;
    console.log("  ", x.model);
  });
  console.log("\n共", total, "款");
  console.log(JSON.stringify(lines, null, 1));
  await c.end();
})();
