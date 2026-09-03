const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model, id FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT') ORDER BY model`);
  console.log("鼎阳产品数:", r.rows.length);
  r.rows.forEach((x) => console.log(x.model));
  await c.end();
})();
