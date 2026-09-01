const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const r = await c.query(
    `SELECT pv."valueString", pv."valueNumber", d.key, d."categoryId"
     FROM "ProductParamValue" pv
     LEFT JOIN "ParamDefinition" d ON d.id = pv."paramDefinitionId"
     LEFT JOIN "Product" p ON p.id = pv."productId"
     WHERE p.model = 'SDS1104X-E' ORDER BY d."sortOrder"`
  );
  r.rows.forEach((x) => console.log(x.key, "=", x.valueString ?? x.valueNumber, "| defCat=" + x.categoryId));
  await c.end();
});
