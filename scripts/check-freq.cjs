const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  // SPECTRUM freqRange 现有值
  const r1 = await c.query(
    `SELECT DISTINCT pv."valueString" FROM "ProductParamValue" pv
     JOIN "ParamDefinition" d ON d.id=pv."paramDefinitionId" AND d.key='freqRange'
     JOIN "Category" cc ON cc.id=d."categoryId" AND cc.code IN ('SIGLENT-SPECTRUM','SIGLENT-VNA')
     ORDER BY pv."valueString"`
  );
  console.log("freqRange 现有值:");
  r1.rows.forEach((x) => console.log("  ", x.valueString));
  await c.end();
});
