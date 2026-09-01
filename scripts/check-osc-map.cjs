const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(
    `SELECT code, "siteCategoryId", "parentId" FROM "Category"
     WHERE code LIKE 'SIGLENT-%OSC%' OR code IN ('SIGLENT-HI-RES-OSC','SIGLENT-DIGITAL-OSC','SIGLENT-HANDHELD-OSC','SIGLENT-COMPACT-OSC','SIGLENT-OSCILLOSCOPE')`
  );
  r.rows.forEach((x) => console.log(x.code.padEnd(24), "siteCat:", x.siteCategoryId, "parent:", x.parentId));
  await c.end();
})();
