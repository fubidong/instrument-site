const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 1) 清空所有可筛选 def 的预置 options（筛选档位始终由产品实际值动态聚合）
  const r1 = await c.query(`UPDATE "ParamDefinition" SET options=NULL WHERE "isFilterable"=true`);
  console.log("cleared preset options on", r1.rowCount, "filterable defs");
  // 2) freqRange 改为不可筛选（由 maxFreq 承担精确上限筛选），清 options
  const r2 = await c.query(
    `UPDATE "ParamDefinition" SET "isFilterable"=false, options=NULL WHERE key='freqRange'`
  );
  console.log("disabled freqRange filtering on", r2.rowCount, "defs");
  await c.end();
})();
