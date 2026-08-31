const { Client } = require("pg");
(async () => {
  const c = await new Client({
    connectionString:
      "postgresql://postgres:postgres@localhost:5432/instrument_site?schema=public",
  });
  await c.connect();
  // 1. 带宽 500 相关产品（归一化后：500mhz）
  const bw = await c.query(`
    SELECT DISTINCT "valueString" FROM "ProductParamValue"
    WHERE "valueString" ~* '500\\s*MHz' AND "valueString" !~ '~'
    ORDER BY "valueString"
  `);
  console.log("500MHz formats:", bw.rows.map((r) => JSON.stringify(r.valueString)).join(" | "));
  // 2. 通道数值格式
  const ch = await c.query(`
    SELECT DISTINCT "valueString" FROM "ProductParamValue"
    WHERE "valueString" ~* '通道|channel' OR "valueString" ~* '^\\s*[2468]\\s*$'
    ORDER BY "valueString"
  `);
  console.log("channel formats:", ch.rows.map((r) => JSON.stringify(r.valueString)).join(" | "));
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
