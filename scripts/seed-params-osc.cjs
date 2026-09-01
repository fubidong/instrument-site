// 示波器完整参数模板（学习自 SIGLENT SDS1000X-E datasheet）
// 挂载到品牌分类 SIGLENT-OSCILLOSCOPE；upsert 不破坏已有参数值
const { Client } = require("pg");
const { randomUUID } = require("crypto");

const CAT_CODE = "SIGLENT-OSCILLOSCOPE";

const GROUPS = [
  { code: "BASIC", zh: "基本参数", en: "Basic Parameters", sort: 0 },
  { code: "ACQUISITION", zh: "采集系统", en: "Acquisition System", sort: 1 },
  { code: "INPUT", zh: "输入", en: "Input", sort: 2 },
  { code: "VERTICAL", zh: "垂直系统", en: "Vertical System", sort: 3 },
  { code: "HORIZONTAL", zh: "水平系统", en: "Horizontal System", sort: 4 },
  { code: "TRIGGER", zh: "触发系统", en: "Trigger System", sort: 5 },
  { code: "MEASUREMENT", zh: "测量与数学", en: "Measurement & Math", sort: 6 },
  { code: "INTERFACE", zh: "接口与显示", en: "Interface & Display", sort: 7 },
  { code: "GENERAL", zh: "通用规格", en: "General Specifications", sort: 8 },
];

const DEFS = [
  { key: "bandwidth", g: "BASIC", zh: "模拟带宽", en: "Bandwidth", type: "enum", imp: true, filt: true, cmp: true, sort: 0 },
  { key: "channels", g: "BASIC", zh: "通道数", en: "Channels", type: "enum", imp: true, filt: true, cmp: true, sort: 1 },
  { key: "sampleRate", g: "BASIC", zh: "最高实时采样率", en: "Max. Real-time Sample Rate", type: "enum", imp: true, filt: true, cmp: true, sort: 2 },
  { key: "verticalResolution", g: "BASIC", zh: "垂直分辨率", en: "Vertical Resolution", type: "enum", imp: true, filt: true, cmp: true, sort: 3 },
  { key: "storageDepth", g: "BASIC", zh: "最大存储深度", en: "Max. Record Length", type: "enum", imp: true, filt: true, cmp: true, sort: 4 },
  { key: "waveformRate", g: "BASIC", zh: "最高波形捕获率", en: "Max. Waveform Capture Rate", type: "enum", imp: true, filt: true, cmp: true, sort: 5 },
  { key: "riseTime", g: "BASIC", zh: "上升时间(典型值)", en: "Rise Time (typ.)", type: "string", imp: false, filt: false, cmp: true, sort: 6 },
  { key: "minVerticalScale", g: "BASIC", zh: "最小垂直刻度", en: "Min. Vertical Scale", type: "string", imp: false, filt: false, cmp: true, sort: 7 },
  { key: "maxInputVoltage", g: "BASIC", zh: "最大输入电压", en: "Max. Input Voltage", type: "string", imp: false, filt: false, cmp: true, sort: 8 },
  { key: "peakDetect", g: "ACQUISITION", zh: "峰值检测", en: "Peak Detect", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
  { key: "average", g: "ACQUISITION", zh: "平均次数", en: "Averages", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
  { key: "eres", g: "ACQUISITION", zh: "ERES 增强分辨率", en: "ERES", type: "string", imp: false, filt: false, cmp: true, sort: 2 },
  { key: "interpolation", g: "ACQUISITION", zh: "波形插值", en: "Waveform Interpolation", type: "string", imp: false, filt: false, cmp: true, sort: 3 },
  { key: "inputCoupling", g: "INPUT", zh: "输入耦合", en: "Coupling", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
  { key: "inputImpedance", g: "INPUT", zh: "输入阻抗", en: "Input Impedance", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
  { key: "probeAttenuation", g: "INPUT", zh: "探头衰减系数", en: "Probe Attenuation", type: "string", imp: false, filt: false, cmp: true, sort: 2 },
  { key: "chIsolation", g: "INPUT", zh: "通道间隔离", en: "Channel Isolation", type: "string", imp: false, filt: false, cmp: true, sort: 3 },
  { key: "verticalScale", g: "VERTICAL", zh: "垂直刻度范围", en: "Vertical Scale Range", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
  { key: "offsetRange", g: "VERTICAL", zh: "偏移范围", en: "Offset Range", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
  { key: "bandwidthLimit", g: "VERTICAL", zh: "带宽限制", en: "Bandwidth Limit", type: "string", imp: false, filt: false, cmp: true, sort: 2 },
  { key: "bandwidthFlatness", g: "VERTICAL", zh: "带宽平坦度", en: "Bandwidth Flatness", type: "string", imp: false, filt: false, cmp: true, sort: 3 },
  { key: "dcGainAccuracy", g: "VERTICAL", zh: "DC 增益精度", en: "DC Gain Accuracy", type: "string", imp: false, filt: false, cmp: true, sort: 4 },
  { key: "offsetAccuracy", g: "VERTICAL", zh: "偏移精度", en: "Offset Accuracy", type: "string", imp: false, filt: false, cmp: true, sort: 5 },
  { key: "noiseLevel", g: "VERTICAL", zh: "底噪", en: "Noise Level", type: "string", imp: false, filt: false, cmp: true, sort: 6 },
  { key: "timebaseRange", g: "HORIZONTAL", zh: "时基范围", en: "Timebase Range", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
  { key: "timebaseAccuracy", g: "HORIZONTAL", zh: "时基精度", en: "Timebase Accuracy", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
  { key: "displayFormat", g: "HORIZONTAL", zh: "显示格式", en: "Display Format", type: "string", imp: false, filt: false, cmp: true, sort: 2 },
  { key: "intensityGrading", g: "HORIZONTAL", zh: "灰度等级", en: "Intensity Grading", type: "string", imp: false, filt: false, cmp: true, sort: 3 },
  { key: "triggerTypes", g: "TRIGGER", zh: "触发类型", en: "Trigger Types", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
  { key: "triggerMode", g: "TRIGGER", zh: "触发模式", en: "Trigger Mode", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
  { key: "triggerCoupling", g: "TRIGGER", zh: "触发耦合", en: "Trigger Coupling", type: "string", imp: false, filt: false, cmp: true, sort: 2 },
  { key: "serialTrigger", g: "TRIGGER", zh: "串行总线触发/解码", en: "Serial Trigger & Decode", type: "string", imp: false, filt: false, cmp: true, sort: 3 },
  { key: "measureParams", g: "MEASUREMENT", zh: "自动测量参数", en: "Auto Measurements", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
  { key: "mathOps", g: "MEASUREMENT", zh: "数学运算", en: "Math Operations", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
  { key: "fftPoints", g: "MEASUREMENT", zh: "FFT 点数", en: "FFT Points", type: "string", imp: false, filt: false, cmp: true, sort: 2 },
  { key: "ioInterface", g: "INTERFACE", zh: "IO 接口", en: "I/O Interface", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
  { key: "remoteControl", g: "INTERFACE", zh: "远程控制", en: "Remote Control", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
  { key: "displaySize", g: "INTERFACE", zh: "显示屏", en: "Display", type: "string", imp: false, filt: false, cmp: true, sort: 2 },
  { key: "displayResolution", g: "INTERFACE", zh: "显示分辨率", en: "Display Resolution", type: "string", imp: false, filt: false, cmp: true, sort: 3 },
  { key: "powerSupply", g: "GENERAL", zh: "电源输入", en: "Power Supply", type: "string", imp: false, filt: false, cmp: false, sort: 0 },
  { key: "powerConsumption", g: "GENERAL", zh: "功耗", en: "Power Consumption", type: "string", imp: false, filt: false, cmp: false, sort: 1 },
  { key: "operatingTemp", g: "GENERAL", zh: "工作温度", en: "Operating Temperature", type: "string", imp: false, filt: false, cmp: false, sort: 2 },
  { key: "dimensions", g: "GENERAL", zh: "尺寸", en: "Dimensions", type: "string", imp: false, filt: false, cmp: false, sort: 3 },
  { key: "weight", g: "GENERAL", zh: "重量", en: "Weight", type: "string", imp: false, filt: false, cmp: false, sort: 4 },
];

async function main() {
  const c = await new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site?schema=public" });
  await c.connect();
  const cat = await c.query(`SELECT id FROM "Category" WHERE code=$1`, [CAT_CODE]);
  if (!cat.rows[0]) { console.error("category not found"); process.exit(1); }
  const catId = cat.rows[0].id;
  console.log("category:", catId, CAT_CODE);

  // upsert 分组
  const groupIds = new Map();
  for (const g of GROUPS) {
    const r = await c.query(
      `INSERT INTO "ParamGroup" (id, "categoryId", code, "sortOrder", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,now(),now())
       ON CONFLICT ("categoryId", code) DO UPDATE SET "sortOrder"=EXCLUDED."sortOrder"
       RETURNING id`,
      [randomUUID(), catId, g.code, g.sort]
    );
    const gid = r.rows[0].id;
    groupIds.set(g.code, gid);
    await c.query(
      `INSERT INTO "ParamGroupTranslation" (id, "paramGroupId", locale, name)
       VALUES ($1,$2,'zh',$3) ON CONFLICT ("paramGroupId", locale) DO UPDATE SET name=EXCLUDED.name`,
      [randomUUID(), gid, g.zh]
    );
    await c.query(
      `INSERT INTO "ParamGroupTranslation" (id, "paramGroupId", locale, name)
       VALUES ($1,$2,'en',$3) ON CONFLICT ("paramGroupId", locale) DO UPDATE SET name=EXCLUDED.name`,
      [randomUUID(), gid, g.en]
    );
    console.log("group:", g.code, "->", gid);
  }

  // upsert 参数
  for (const d of DEFS) {
    const r = await c.query(
      `INSERT INTO "ParamDefinition" (id, "categoryId", "paramGroupId", key, type, unit, "isFilterable", "isComparable", "isRequired", "isHighlight", "sortOrder", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,NULL,$6,$7,false,$8,$9,now(),now())
       ON CONFLICT ("categoryId", key) DO UPDATE SET
         "paramGroupId"=EXCLUDED."paramGroupId", type=EXCLUDED.type, "isFilterable"=EXCLUDED."isFilterable",
         "isComparable"=EXCLUDED."isComparable", "isHighlight"=EXCLUDED."isHighlight", "sortOrder"=EXCLUDED."sortOrder"
       RETURNING id`,
      [randomUUID(), catId, groupIds.get(d.g), d.key, d.type, d.filt, d.cmp, d.imp, d.sort]
    );
    const did = r.rows[0].id;
    await c.query(
      `INSERT INTO "ParamDefinitionTranslation" (id, "paramDefinitionId", locale, name)
       VALUES ($1,$2,'zh',$3) ON CONFLICT ("paramDefinitionId", locale) DO UPDATE SET name=EXCLUDED.name`,
      [randomUUID(), did, d.zh]
    );
    await c.query(
      `INSERT INTO "ParamDefinitionTranslation" (id, "paramDefinitionId", locale, name)
       VALUES ($1,$2,'en',$3) ON CONFLICT ("paramDefinitionId", locale) DO UPDATE SET name=EXCLUDED.name`,
      [randomUUID(), did, d.en]
    );
    console.log("def:", d.key, "->", did, "group=", d.g);
  }

  console.log("DONE. groups:", GROUPS.length, "defs:", DEFS.length);
  await c.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
