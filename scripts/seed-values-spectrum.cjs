// 添加 maxFreq 参数定义（频谱+VNA 共用于筛选），回填频谱仪全部产品参数值
const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  // 1) 确保 maxFreq def 存在于 SPECTRUM 和 VNA
  const cats = await c.query(
    `SELECT id, code FROM "Category" WHERE code IN ('SIGLENT-SPECTRUM','SIGLENT-VNA')`
  );
  const maxfreqDefs = {};
  for (const cat of cats.rows) {
    const exists = await c.query(`SELECT id FROM "ParamDefinition" WHERE "categoryId"=$1 AND key='maxFreq'`, [cat.id]);
    if (exists.rows.length === 0) {
      // 找 BASIC 组
      const grp = await c.query(`SELECT id FROM "ParamGroup" WHERE "categoryId"=$1 AND code='BASIC' ORDER BY "sortOrder" LIMIT 1`, [cat.id]);
      const ins = await c.query(
        `INSERT INTO "ParamDefinition" ("id","categoryId","paramGroupId","key","type","unit","isFilterable","isComparable","isRequired","isHighlight","sortOrder","createdAt","updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 'maxFreq', 'enum', 'GHz', true, true, false, true, 20, now(), now())
         ON CONFLICT ("categoryId", key) DO UPDATE SET "isFilterable"=true, "isHighlight"=true, "unit"='GHz'
         RETURNING id`,
        [cat.id, grp.rows[0]?.id ?? null]
      );
      // 翻译（upsert）
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
      maxfreqDefs[cat.code] = ins.rows[0].id;
      console.log("created maxFreq", cat.code, maxfreqDefs[cat.code]);
    } else {
      maxfreqDefs[cat.code] = exists.rows[0].id;
    }
  }
  const catId = (code) => cats.rows.find((x) => x.code === code).id;

  // 2) 查询 def ids
  async function defId(catCode, key) {
    const r = await c.query(`SELECT id FROM "ParamDefinition" WHERE "categoryId"=$1 AND key=$2`, [catId(catCode), key]);
    return r.rows[0]?.id;
  }
  const D = {
    spectrum: {
      freqRange: await defId("SIGLENT-SPECTRUM", "freqRange"),
      maxFreq: maxfreqDefs["SIGLENT-SPECTRUM"],
      minRbw: await defId("SIGLENT-SPECTRUM", "minRbw"),
      rbwRange: await defId("SIGLENT-SPECTRUM", "rbwRange"),
      danl: await defId("SIGLENT-SPECTRUM", "danl"),
      phaseNoise: await defId("SIGLENT-SPECTRUM", "phaseNoise"),
      trackingSource: await defId("SIGLENT-SPECTRUM", "trackingSource"),
      realTimeBW: await defId("SIGLENT-SPECTRUM", "realTimeBW"),
      ioInterface: await defId("SIGLENT-SPECTRUM", "ioInterface"),
      remoteControl: await defId("SIGLENT-SPECTRUM", "remoteControl"),
      displaySize: await defId("SIGLENT-SPECTRUM", "displaySize"),
      powerSupply: await defId("SIGLENT-SPECTRUM", "powerSupply"),
      amplitudeAccuracy: await defId("SIGLENT-SPECTRUM", "amplitudeAccuracy"),
      measurementFunctions: await defId("SIGLENT-SPECTRUM", "measurementFunctions"),
      demodulation: await defId("SIGLENT-SPECTRUM", "demodulation"),
    },
  };

  // 3) 产品 by model
  const prod = {};
  const pr = await c.query(`SELECT p.id, p.model FROM "Product" p`);
  for (const r of pr.rows) prod[r.model.toUpperCase().trim()] = r.id;

  // 型号 → 参数值（freq/maxFreq 型号级；其余系列级）
  // [model, freqRange, maxFreq]
  const models = [
    ["SSA1015X-C", "9 kHz~1.5 GHz", "1.5 GHz"],
    ["SSA3015X Plus", "9 kHz~1.5 GHz", "1.5 GHz"],
    ["SSA3021X Plus", "9 kHz~2.1 GHz", "2.1 GHz"],
    ["SSA3032X Plus", "9 kHz~3.2 GHz", "3.2 GHz"],
    ["SSA3075X Plus", "9 kHz~7.5 GHz", "7.5 GHz"],
    ["SSA3075X-C", "9 kHz~7.5 GHz", "7.5 GHz"],
    ["SSA3032X-R", "9 kHz~3.2 GHz", "3.2 GHz"],
    ["SSA3050X-R", "9 kHz~5 GHz", "5 GHz"],
    ["SSA3075X-R", "9 kHz~7.5 GHz", "7.5 GHz"],
    ["SSA5083A", "9 kHz~13.6 GHz", "13.6 GHz"],
    ["SSA5085A", "9 kHz~26.5 GHz", "26.5 GHz"],
    ["SSA6088A", "10 Hz~50 GHz", "50 GHz"],
    ["SHA851A", "9 kHz~3.6 GHz", "3.6 GHz"],
    ["SHA852A", "9 kHz~7.5 GHz", "7.5 GHz"],
    ["SHA861A", "9 kHz~3.6 GHz", "3.6 GHz"],
    ["SHA862A", "9 kHz~7.5 GHz", "7.5 GHz"],
    ["SHA863A", "9 kHz~14 GHz", "14 GHz"],
    ["SHA864A", "9 kHz~20 GHz", "20 GHz"],
    ["SHA865A", "9 kHz~26.5 GHz", "26.5 GHz"],
  ];

  // 系列级规格
  const seriesSpec = {
    "SSA1000X": { minRbw: "1 Hz", rbwRange: "1 Hz~1 MHz", danl: "-161 dBm/Hz", phaseNoise: "<-98 dBc/Hz", trackingSource: "选配", realTimeBW: null },
    "SSA3000X Plus": { minRbw: "1 Hz", rbwRange: "1 Hz~3 MHz", danl: null, phaseNoise: "<-98 dBc/Hz", trackingSource: "标配", realTimeBW: null }, // danl per model
    "SSA3000X-R": { minRbw: "1 Hz", rbwRange: "1 Hz~3 MHz", danl: "-165 dBm/Hz", phaseNoise: "<-98 dBc/Hz", trackingSource: "无（实时分析）", realTimeBW: "25 MHz, 40 MHz（选件）" },
    "SSA5000A": { minRbw: "1 Hz", rbwRange: "1 Hz~10 MHz", danl: "-165 dBm/Hz", phaseNoise: "<-105 dBc/Hz", trackingSource: "无", realTimeBW: "25 MHz, 40 MHz（选件）" },
    "SSA6000A": { minRbw: "1 Hz", rbwRange: "1 Hz~10 MHz", danl: "-165 dBm/Hz", phaseNoise: "<-123 dBc/Hz @1 GHz", trackingSource: "无", realTimeBW: "400 MHz（实时）" },
    "SHA850A": { minRbw: "1 Hz", rbwRange: "1 Hz~3 MHz", danl: "-165 dBm/Hz", phaseNoise: "<-104 dBc/Hz", trackingSource: "独立信号源（选配）", realTimeBW: null },
    "SHA860A": { minRbw: "1 Hz", rbwRange: "1 Hz~10 MHz", danl: "-165 dBm/Hz", phaseNoise: "<-104 dBc/Hz", trackingSource: "内置独立信号源", realTimeBW: "40 MHz, 110 MHz（选件）" },
  };
  // 每型号 danl（SSA3000X Plus 按型号）
  const danlByModel = { "SSA3015X Plus": "-156 dBm/Hz", "SSA3021X Plus": "-161 dBm/Hz", "SSA3032X Plus": "-161 dBm/Hz", "SSA3075X Plus": "-165 dBm/Hz", "SSA3075X-C": "-165 dBm/Hz" };

  const lineOf = {};
  const lr = await c.query(`SELECT p.model, pl.code AS line FROM "Product" p LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"`);
  for (const r of lr.rows) lineOf[r.model.toUpperCase().trim()] = r.line;

  // 通用详情值（系列级）
  const common = {
    ioInterface: "LAN, USB Device, USB Host(USB-GPIB)",
    remoteControl: "SCPI (USB-TMC/VXI-11/Socket/Telnet), Web Browser",
    powerSupply: "100-240 V AC, 50/60 Hz",
    amplitudeAccuracy: "< 0.7 dB（典型值）",
  };
  const displaySizeBySeries = { "SSA1000X": "8.4 英寸", "SSA3000X Plus": "10.1 英寸", "SSA3000X-R": "10.1 英寸", "SSA5000A": "10.1 英寸", "SSA6000A": "10.1 英寸", "SHA850A": "8.4 英寸", "SHA860A": "8.4 英寸" };

  // 4) upsert 参数值
  let count = 0;
  const upsert = async (productId, defId, val) => {
    if (!productId || !defId || val === null || val === undefined) return;
    await c.query(
      `INSERT INTO "ProductParamValue" ("id","productId","paramDefinitionId","valueString","createdAt","updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
       ON CONFLICT ("productId","paramDefinitionId") DO UPDATE SET "valueString"=EXCLUDED."valueString", "updatedAt"=now()`,
      [productId, defId, String(val)]
    );
    count++;
  };

  for (const [model, freq, maxf] of models) {
    const pid = prod[model.toUpperCase()];
    if (!pid) { console.log("!! 未找到产品", model); continue; }
    const line = lineOf[model.toUpperCase()];
    const ss = seriesSpec[line];
    if (!ss) { console.log("!! 未找到系列规格", line); continue; }
    const danl = danlByModel[model] ?? ss.danl;
    await upsert(pid, D.spectrum.freqRange, freq);
    await upsert(pid, D.spectrum.maxFreq, maxf);
    await upsert(pid, D.spectrum.minRbw, ss.minRbw);
    await upsert(pid, D.spectrum.rbwRange, ss.rbwRange);
    await upsert(pid, D.spectrum.danl, danl);
    await upsert(pid, D.spectrum.phaseNoise, ss.phaseNoise);
    await upsert(pid, D.spectrum.trackingSource, ss.trackingSource);
    await upsert(pid, D.spectrum.realTimeBW, ss.realTimeBW);
    await upsert(pid, D.spectrum.ioInterface, common.ioInterface);
    await upsert(pid, D.spectrum.remoteControl, common.remoteControl);
    await upsert(pid, D.spectrum.powerSupply, common.powerSupply);
    await upsert(pid, D.spectrum.amplitudeAccuracy, common.amplitudeAccuracy);
    await upsert(pid, D.spectrum.displaySize, displaySizeBySeries[line]);
    console.log("  ✓", model, freq, "|", danl, "|", ss.phaseNoise);
  }
  console.log("共写入/更新", count, "个参数值");
  await c.end();
});
