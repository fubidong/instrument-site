const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(
    `SELECT d.key, d."isFilterable", d."filterUI", left(COALESCE(d.options,''), 300) AS opt
     FROM "ParamDefinition" d
     WHERE d."categoryId" IN (SELECT id FROM "Category" WHERE code IN ('SIGLENT-SPECTRUM','SIGLENT-VNA'))
       AND d."isFilterable"=true ORDER BY d.key`
  );
  r.rows.forEach((x) => console.log(x.key.padEnd(14), "f=" + x.isFilterable, "ui=" + (x.filterUI || "-"), "|", (x.opt || "(null)").slice(0, 200)));
  await c.end();
})();
