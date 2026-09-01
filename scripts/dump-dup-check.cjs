const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const cats = ["SIGLENT-FUNCTION-GEN", "SIGLENT-SPECTRUM", "SIGLENT-VNA", "SIGLENT-RF-GEN", "SIGLENT-MULTIMETER", "SIGLENT-MODULAR"];
  for (const code of cats) {
    const cat = await c.query(`SELECT id FROM "Category" WHERE code=$1`, [code]);
    if (!cat.rows[0]) continue;
    const r = await c.query(
      `SELECT d.key, d.type, d."sortOrder", tr.name AS zh, ten.name AS en,
        (SELECT count(*) FROM "ProductParamValue" pv WHERE pv."paramDefinitionId"=d.id) AS vals
       FROM "ParamDefinition" d
       LEFT JOIN "ParamDefinitionTranslation" tr ON tr."paramDefinitionId"=d.id AND tr.locale='zh'
       LEFT JOIN "ParamDefinitionTranslation" ten ON ten."paramDefinitionId"=d.id AND ten.locale='en'
       WHERE d."categoryId"=$1 ORDER BY d."sortOrder", d.key`,
      [cat.rows[0].id]
    );
    console.log("=== " + code + " ===");
    r.rows.forEach((x) => console.log("  " + x.key.padEnd(22), "vals=" + String(x.vals).padEnd(3), "|", x.zh, "/", x.en));
  }
  await c.end();
});
