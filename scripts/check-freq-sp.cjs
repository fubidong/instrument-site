const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(
    `SELECT d.id AS defid, pv."valueString", p.model
     FROM "ProductParamValue" pv
     JOIN "ParamDefinition" d ON d.id=pv."paramDefinitionId"
     JOIN "Product" p ON p.id=pv."productId"
     WHERE d."categoryId"=(SELECT id FROM "Category" WHERE code='SIGLENT-SPECTRUM') AND d.key='freqRange'
     ORDER BY pv."valueString"`
  );
  console.log("SIGLENT-SPECTRUM freqRange def =", r.rows[0]?.defid);
  r.rows.forEach((x) => console.log("  ", x.model.padEnd(16), x.valueString));
  await c.end();
})();
