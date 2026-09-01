const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const r = await c.query(
    `SELECT cc.code, d.key, d."isFilterable", d."filterUI", d."isHighlight", g.code AS grp
     FROM "ParamDefinition" d
     JOIN "Category" cc ON cc.id=d."categoryId"
     LEFT JOIN "ParamGroup" g ON g.id=d."paramGroupId"
     WHERE cc.code IN ('SIGLENT-SPECTRUM','SIGLENT-VNA')
     ORDER BY cc.code, d."sortOrder"`
  );
  r.rows.forEach((x) => console.log(x.code.padEnd(20), x.key.padEnd(20), "f="+x.isFilterable, "ui="+(x.filterUI||"-"), "hl="+x.isHighlight, x.grp||""));
  await c.end();
});
