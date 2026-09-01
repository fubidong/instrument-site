// 射频/微波信号发生器（SSG）参数值回填
const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const catId = (await c.query(`SELECT id FROM "Category" WHERE code='SIGLENT-RF-GEN'`)).rows[0].id;
  // 确保 maxFreq def
  const exists = await c.query(`SELECT id FROM "ParamDefinition" WHERE "categoryId"=$1 AND key='maxFreq'`, [catId]);
  if (exists.rows.length === 0) {
    const grp = await c.query(`SELECT id FROM "ParamGroup" WHERE "categoryId"=$1 AND code='BASIC' ORDER BY "sortOrder" LIMIT 1`, [catId]);
    const ins = await c.query(
      `INSERT INTO "ParamDefinition" ("id","categoryId","paramGroupId","key","type","unit","isFilterable","isComparable","isRequired","isHighlight","sortOrder","createdAt","updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'maxFreq', 'enum', 'GHz', true, true, false, true, 20, now(), now())
       ON CONFLICT ("categoryId", key) DO UPDATE SET "isFilterable"=true, "isHighlight"=true, "unit"='GHz' RETURNING id`,
      [catId, grp.rows[0]?.id ?? null]
    );
    await c.query(
      `INSERT INTO "ParamDefinitionTranslation" (id, "paramDefinitionId", locale, name)
       VALUES (gen_random_uuid(), $1, 'zh', '频率上限') ON CONFLICT ("paramDefinitionId", locale) DO UPDATE SET name=EXCLUDED.name`,
      [ins.rows[0].id]
    );
    await c.query(
      `INSERT INTO "ParamDefinitionTranslation" (id, "paramDefinitionId", locale, name)
       VALUES (gen_random_uuid(), $1, 'en', 'Max Frequency') ON CONFLICT ("paramDefinitionId", locale) DO UPDATE SET name=EXCLUDED.name`,
      [ins.rows[0].id]
    );
    console.log("created maxFreq for RF-GEN");
  }

  async function defId(key) {
    const r = await c.query(`SELECT id FROM "ParamDefinition" WHERE "categoryId"=$1 AND key=$2`, [catId, key]);
    return r.rows[0]?.id;
  }
  const D = {
    freqRange: await defId("freqRange"),
    maxFreq: (await c.query(`SELECT id FROM "ParamDefinition" WHERE "categoryId"=$1 AND key='maxFreq'`, [catId])).rows[0].id,
    outputPower: await defId("outputPower"),
    phaseNoise: await defId("phaseNoise"),
    freqResolution: await defId("freqResolution"),
    modulation: await defId("modulation"),
    iqMod: await defId("iqMod"),
    amplitudeAccuracy: await defId("amplitudeAccuracy"),
    harmonics: await defId("harmonics"),
    ioInterface: await defId("ioInterface"),
    remoteControl: await defId("remoteControl"),
    displaySize: await defId("displaySize"),
  };

  const prod = {};
  const pr = await c.query(`SELECT p.id, p.model FROM "Product" p`);
  for (const r of pr.rows) prod[r.model.toUpperCase().trim()] = r.id;

  // [model, freqRange, maxFreq, iqMod]
  const models = [
    ["SSG5040X", "9 kHz~4 GHz", "4 GHz", "否"],
    ["SSG5040X-V", "9 kHz~4 GHz", "4 GHz", "是"],
    ["SSG5060X", "9 kHz~6 GHz", "6 GHz", "否"],
    ["SSG5060X-V", "9 kHz~6 GHz", "6 GHz", "是"],
    ["SSG5083A", "9 kHz~13.6 GHz", "13.6 GHz", "否"],
    ["SSG5085A", "9 kHz~20 GHz", "20 GHz", "否"],
    ["SSG6082A-V", "9 kHz~8 GHz", "8 GHz", "是"],
    ["SSG6083A", "100 kHz~13.6 GHz", "13.6 GHz", "否"],
    ["SSG6085A", "100 kHz~20 GHz", "20 GHz", "否"],
    ["SSG6087A", "100 kHz~40 GHz", "40 GHz", "否"],
    ["SSG6089A", "100 kHz~67 GHz", "67 GHz", "否"],
  ];

  const seriesSpec = {
    "SSG5000X": { phaseNoise: "-120 dBc/Hz @1 GHz, 20 kHz 偏移（典型值）", outputPower: "-110 dBm ~ +15 dBm", modulation: "AM, FM, PM, 脉冲；IQ 调制（V 型号）", amplitudeAccuracy: "≤ 0.7 dB（典型值）" },
    "SSG5000A": { phaseNoise: "-120 dBc/Hz @1 GHz, 20 kHz 偏移（典型值）", outputPower: "-110 dBm ~ +15 dBm", modulation: "AM, FM, PM, 脉冲调制, 脉冲序列", amplitudeAccuracy: "≤ 0.7 dB（典型值）" },
    "SSG6082A-V": { phaseNoise: "-135 dBc/Hz @1 GHz, 10 kHz 偏移（典型值）", outputPower: "-130 dBm ~ +20 dBm", modulation: "AM, FM, PM, 脉冲调制, 脉冲序列, IQ 矢量调制（500 MHz 带宽）", amplitudeAccuracy: "≤ 0.7 dB（典型值）" },
    "SSG6000A": { phaseNoise: "-135 dBc/Hz @1 GHz, 10 kHz 偏移（典型值）", outputPower: "-130 dBm ~ +24 dBm", modulation: "AM, FM, PM, 脉冲调制, 脉冲序列发生器", amplitudeAccuracy: "≤ 0.7 dB（典型值）" },
  };
  const lineOf = {};
  const lr = await c.query(`SELECT p.model, pl.code AS line FROM "Product" p LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"`);
  for (const r of lr.rows) lineOf[r.model.toUpperCase().trim()] = r.line;

  const common = {
    freqResolution: "0.001 Hz",
    ioInterface: "USB Host, USB Device (USB-TMC), LAN (VXI-11/Socket/Telnet), 选配 GPIB",
    remoteControl: "SCPI (USB-TMC/VXI-11/Socket/Telnet)",
    displaySize: "5 英寸电容触摸屏",
    harmonics: "< -40 dBc（典型值）",
  };

  let count = 0;
  const upsert = async (pid, defId_, val) => {
    if (!pid || !defId_ || val === null || val === undefined) return;
    await c.query(
      `INSERT INTO "ProductParamValue" ("id","productId","paramDefinitionId","valueString","createdAt","updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
       ON CONFLICT ("productId","paramDefinitionId") DO UPDATE SET "valueString"=EXCLUDED."valueString", "updatedAt"=now()`,
      [pid, defId_, String(val)]
    );
    count++;
  };

  for (const [model, freq, maxf, iq] of models) {
    const pid = prod[model.toUpperCase()];
    if (!pid) { console.log("!! 未找到产品", model); continue; }
    const line = lineOf[model.toUpperCase()];
    const ss = seriesSpec[line] ?? seriesSpec["SSG6000A"];
    await upsert(pid, D.freqRange, freq);
    await upsert(pid, D.maxFreq, maxf);
    await upsert(pid, D.iqMod, iq);
    await upsert(pid, D.phaseNoise, ss.phaseNoise);
    await upsert(pid, D.outputPower, ss.outputPower);
    await upsert(pid, D.modulation, ss.modulation);
    await upsert(pid, D.amplitudeAccuracy, ss.amplitudeAccuracy);
    await upsert(pid, D.freqResolution, common.freqResolution);
    await upsert(pid, D.ioInterface, common.ioInterface);
    await upsert(pid, D.remoteControl, common.remoteControl);
    await upsert(pid, D.displaySize, common.displaySize);
    await upsert(pid, D.harmonics, common.harmonics);
    console.log("  ✓", model, freq, "| IQ:", iq, "|", ss.phaseNoise);
  }
  console.log("共写入/更新", count, "个参数值");
  await c.end();
});
