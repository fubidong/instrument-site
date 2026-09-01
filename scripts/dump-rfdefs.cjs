const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(
    `SELECT d.key, d."isFilterable", d."isHighlight", g.code grp FROM "ParamDefinition" d
     LEFT JOIN "ParamGroup" g ON g.id=d."paramGroupId"
     WHERE d."categoryId"=(SELECT id FROM "Category" WHERE code='SIGLENT-RF-GEN')
     ORDER BY d."sortOrder"`
  );
  r.rows.forEach((x) => console.log(x.key.padEnd(18), "f=" + x.isFilterable, "hl=" + x.isHighlight, x.grp || ""));
  await c.end();
})();
