// 盘点：每个品类 可筛选/重要 def 的值覆盖率（按系列）
const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const r = await c.query(
    `SELECT c.code AS cat, d.key AS pkey, d."isFilterable" AS filt, d."isHighlight" AS hl,
       (SELECT count(*) FROM "ProductParamValue" pv
        JOIN "Product" p ON p.id=pv."productId" AND p."isActive"=true
        JOIN "ProductLine" pl ON pl.id=p."productLineId"
        WHERE pv."paramDefinitionId"=d.id AND pl."categoryId"=c.id) AS vals
     FROM "Category" c
     JOIN "ParamDefinition" d ON d."categoryId"=c.id
     WHERE c."brandId"='2235b359-3d5c-4dcc-b763-3ea81273fd22'
     ORDER BY c.code, d."sortOrder"`
  );
  let cur = "";
  for (const row of r.rows) {
    if (row.cat !== cur) { console.log("\n=== " + row.cat + " ==="); cur = row.cat; }
    const mark = (row.filt ? "F" : "-") + (row.hl ? "H" : "-");
    console.log("  [" + mark + "] " + row.pkey.padEnd(20) + " vals=" + row.vals);
  }
  await c.end();
});
