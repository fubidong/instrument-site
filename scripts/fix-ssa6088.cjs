const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  await c.query(
    `UPDATE "ProductParamValue" SET "valueString"='2 Hz~50 GHz',"updatedAt"=now()
     WHERE "paramDefinitionId"=(SELECT id FROM "ParamDefinition" WHERE key='freqRange' AND "categoryId"=(SELECT id FROM "Category" WHERE code='SIGLENT-SPECTRUM'))
       AND "productId"=(SELECT id FROM "Product" WHERE model='SSA6088A')`
  );
  console.log("SSA6088A freqRange updated");
  await c.end();
})();
