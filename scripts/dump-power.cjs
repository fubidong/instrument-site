const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(
    `SELECT cc.code AS cat, p.model, pl.code AS line FROM "Product" p
     LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
     LEFT JOIN "Category" cc ON cc.id=pl."categoryId"
     WHERE cc.code IN ('SIGLENT-LINEAR-POWER','SIGLENT-SMU','SIGLENT-SWITCH-POWER','SIGLENT-SOURCE-LOAD','SIGLENT-LOAD','SIGLENT-MULTIMETER','SIGLENT-MODULAR')
     ORDER BY cc.code, p.model`
  );
  let cur = "";
  r.rows.forEach((x) => {
    if (x.cat !== cur) { cur = x.cat; console.log("\n## " + cur); }
    console.log("  ", x.model.padEnd(16), "|", x.line);
  });
  await c.end();
})();
