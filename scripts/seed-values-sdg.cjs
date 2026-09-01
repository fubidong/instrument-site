// 回填产品参数值（函数发生器 SDG）
// 型号级 maxFrequency + 系列级规格；upsert 不破坏已有值
const { Client } = require("pg");
const { randomUUID } = require("crypto");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });

const CAT_CODE = "SIGLENT-FUNCTION-GEN";
// 系列 → 系列级规格
const SERIES = {
  "SDG1000X": { channels: "2", sampleRate: "150 MSa/s", verticalResolution: "14-bit", arbitraryDepth: "16 kpts", maxAmplitude: "±10 V", outputTypes: "正弦、方波、锯齿波、脉冲、噪声、任意波（196种）", modulation: "AM, DSB-AM, FM, PM, FSK, ASK, PSK, PWM", ioInterface: "USB Host, USB Device, LAN", displaySize: "4.3\" TFT-LCD" },
  "SDG1000X Plus": { channels: "2", sampleRate: "1 GSa/s", verticalResolution: "16-bit", arbitraryDepth: "8 Mpts", maxAmplitude: "±10 V", outputTypes: "正弦、方波、锯齿波、脉冲、噪声、任意波", modulation: "AM, DSB-AM, FM, PM, FSK, ASK, PSK, PWM", ioInterface: "USB Host, USB Device, LAN", displaySize: "4.3\" 触摸屏" },
  "SDG2000X": { channels: "2", sampleRate: "1.2 GSa/s", verticalResolution: "16-bit", arbitraryDepth: "8 pts ~ 8 Mpts", maxAmplitude: "±10 V", outputTypes: "正弦、方波、锯齿波、脉冲、噪声、任意波", modulation: "AM, FM, PM, FSK, ASK, PSK, DSB-AM, PWM", ioInterface: "USB Host, USB Device, LAN", displaySize: "4.3\" 触摸屏" },
  "SDG3000X": { channels: "2", sampleRate: "1.2 GSa/s", verticalResolution: "16-bit", arbitraryDepth: "20 Mpts/ch（可选40 Mpts/ch）", outputTypes: "正弦、方波、锯齿波、脉冲、噪声、任意波（196种）", modulation: "AM, FM, PM, FSK, ASK, PSK, QAM 等", ioInterface: "USB Host, USB Device, LAN", displaySize: "7\" 触摸屏" },
  "SDG6000X": { channels: "2", sampleRate: "2.4 GSa/s", verticalResolution: "16-bit", arbitraryDepth: "2 ~ 20 Mpts", outputTypes: "正弦、方波、锯齿波、脉冲、噪声、任意波", modulation: "AM, FM, PM, FSK, ASK, PSK, QAM 等", ioInterface: "USB Host, USB Device, LAN", displaySize: "4.3\" 触摸屏" },
  "SDG6000X-E": { channels: "2", sampleRate: "2.4 GSa/s", verticalResolution: "16-bit", arbitraryDepth: "2 ~ 20 Mpts", outputTypes: "正弦、方波、锯齿波、脉冲、噪声、任意波", modulation: "AM, FM, PM, FSK, ASK, PSK 等", ioInterface: "USB Host, USB Device, LAN", displaySize: "4.3\" 触摸屏" },
  "SDG7000A": { channels: "2", sampleRate: "5 GSa/s", verticalResolution: "14-bit", arbitraryDepth: "512 Mpts", outputTypes: "正弦、方波、锯齿波、脉冲、噪声、任意波（DC~1 GHz）", modulation: "AM, FM, PM, FSK, ASK, PSK, QAM 等", ioInterface: "USB, LAN", displaySize: "触摸屏" },
};
// 型号 → 最大输出频率
const MODELS = {
  "SDG1022X": "25 MHz", "SDG1032X": "30 MHz", "SDG1062X": "60 MHz",
  "SDG1022X Plus": "25 MHz", "SDG1032X Plus": "30 MHz", "SDG1062X Plus": "60 MHz",
  "SDG2082X": "80 MHz", "SDG2122X": "120 MHz",
  "SDG3082X": "80 MHz", "SDG3162X": "160 MHz", "SDG3202X": "200 MHz",
  "SDG6032X": "350 MHz", "SDG6052X": "500 MHz",
  "SDG6012X-E": "160 MHz", "SDG6022X-E": "200 MHz", "SDG6032X-E": "350 MHz", "SDG6052X-E": "500 MHz",
  "SDG7032A": "350 MHz", "SDG7052A": "500 MHz", "SDG7102A": "1 GHz",
};

c.connect().then(async () => {
  const cat = await c.query(`SELECT id FROM "Category" WHERE code=$1`, [CAT_CODE]);
  const catId = cat.rows[0].id;
  // 取所有 def
  const defs = await c.query(`SELECT id, key FROM "ParamDefinition" WHERE "categoryId"=$1`, [catId]);
  const defId = Object.fromEntries(defs.rows.map((r) => [r.key, r.id]));
  // 取所有产品
  const prods = await c.query(
    `SELECT p.id, p.model, pl.code AS line FROM "Product" p
     LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId" WHERE p."isActive"=true`
  );
  const prodMap = new Map();
  for (const p of prods.rows) prodMap.set(p.model, p);
  // 找该分类下产品（函数发生器）
  const catProds = prods.rows.filter((p) => SERIES[p.line]);

  let n = 0;
  for (const p of catProds) {
    const series = SERIES[p.line];
    const modelFreq = MODELS[p.model];
    const entries = { ...series };
    if (modelFreq) entries.maxFrequency = modelFreq;
    for (const [key, val] of Object.entries(entries)) {
      if (!defId[key]) { console.log("  skip missing def:", key); continue; }
      await c.query(
        `INSERT INTO "ProductParamValue" (id,"productId","paramDefinitionId","valueString","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,now(),now())
         ON CONFLICT ("productId","paramDefinitionId") DO UPDATE SET "valueString"=EXCLUDED."valueString"`,
        [randomUUID(), p.id, defId[key], val]
      );
      n++;
    }
  }
  console.log("DONE. products:", catProds.length, "values:", n);
  await c.end();
});
