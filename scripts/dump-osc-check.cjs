const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const catId = "f9cc9684-c029-44ae-8557-0be1895f8cb3"; // SIGLENT-OSCILLOSCOPE
  const g = await c.query(
    `SELECT g.code, count(d.id) AS defs, sum(case when d."isHighlight" then 1 else 0 end) AS hl
     FROM "ParamGroup" g LEFT JOIN "ParamDefinition" d ON d."paramGroupId"=g.id
     WHERE g."categoryId"=$1 GROUP BY g.id, g.code ORDER BY g."sortOrder"`,
    [catId]
  );
  g.rows.forEach((r) => console.log(r.code.padEnd(12), "defs=" + r.defs, "highlight=" + r.hl));
  const d = await c.query(
    `SELECT d.key, d.type, d."isFilterable" AS f, d."isComparable" AS c, d."isHighlight" AS h, tr.name AS zh, ten.name AS en
     FROM "ParamDefinition" d
     LEFT JOIN "ParamDefinitionTranslation" tr ON tr."paramDefinitionId"=d.id AND tr.locale='zh'
     LEFT JOIN "ParamDefinitionTranslation" ten ON ten."paramDefinitionId"=d.id AND ten.locale='en'
     WHERE d."categoryId"=$1 ORDER BY d."sortOrder"`,
    [catId]
  );
  d.rows.forEach((r) => console.log(
    r.key.padEnd(20), r.type.padEnd(6), "f=" + (r.f ? "1" : "0"), "c=" + (r.c ? "1" : "0"), "h=" + (r.h ? "1" : "0"),
    "|", r.zh, "/", r.en
  ));
  await c.end();
});
