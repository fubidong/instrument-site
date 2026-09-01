const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(
    `SELECT DISTINCT pv."valueString" FROM "ProductParamValue" pv WHERE pv."paramDefinitionId"='8beec95e-d69b-49cb-99e9-ca173edefbc8'`
  );
  console.log("DISTINCT freqRange values (def 8beec95e):", r.rows.length);
  r.rows.forEach((x, i) => console.log(" ", i + 1, JSON.stringify(x.valueString)));
  // 也查 product count
  const cnt = await c.query(
    `SELECT count(*)::int n FROM "ProductParamValue" pv WHERE pv."paramDefinitionId"='8beec95e-d69b-49cb-99e9-ca173edefbc8'`
  );
  console.log("total rows:", cnt.rows[0].n);
  await c.end();
})();
