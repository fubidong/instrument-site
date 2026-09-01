// 通用参数模板写入脚本（按分类 code + 分组/参数定义）
const { Client } = require("pg");
const { randomUUID } = require("crypto");

const TASKS = [
  {
    catCode: "SIGLENT-LINEAR-POWER",
    groups: [
      { code: "BASIC", zh: "基本参数", en: "Basic Parameters", sort: 0 },
      { code: "OUTPUT", zh: "输出特性", en: "Output Characteristics", sort: 1 },
      { code: "PERFORMANCE", zh: "性能指标", en: "Performance", sort: 2 },
      { code: "FUNCTION", zh: "功能特性", en: "Functions", sort: 3 },
      { code: "INTERFACE", zh: "接口与显示", en: "Interface & Display", sort: 4 },
      { code: "GENERAL", zh: "通用规格", en: "General Specifications", sort: 5 },
    ],
    defs: [
      { key: "channels", g: "BASIC", zh: "输出通道数", en: "Output Channels", type: "enum", imp: true, filt: true, cmp: true, sort: 0 },
      { key: "voltageRange", g: "BASIC", zh: "输出电压范围", en: "Output Voltage Range", type: "string", imp: true, filt: true, cmp: true, sort: 1 },
      { key: "currentRange", g: "BASIC", zh: "输出电流范围", en: "Output Current Range", type: "string", imp: true, filt: true, cmp: true, sort: 2 },
      { key: "maxPower", g: "BASIC", zh: "最大输出功率", en: "Max. Output Power", type: "enum", imp: true, filt: true, cmp: true, sort: 3 },
      { key: "outputModes", g: "BASIC", zh: "输出模式", en: "Output Modes", type: "string", imp: false, filt: false, cmp: true, sort: 4 },
      { key: "display", g: "BASIC", zh: "显示屏", en: "Display", type: "string", imp: false, filt: false, cmp: true, sort: 5 },
      { key: "voltageResolution", g: "OUTPUT", zh: "电压分辨率", en: "Voltage Resolution", type: "enum", imp: true, filt: true, cmp: true, sort: 0 },
      { key: "currentResolution", g: "OUTPUT", zh: "电流分辨率", en: "Current Resolution", type: "enum", imp: true, filt: true, cmp: true, sort: 1 },
      { key: "cvSetAccuracy", g: "OUTPUT", zh: "CV 设定精度", en: "CV Set Accuracy", type: "string", imp: false, filt: false, cmp: true, sort: 2 },
      { key: "cvReadbackAccuracy", g: "OUTPUT", zh: "CV 回读精度", en: "CV Readback Accuracy", type: "string", imp: false, filt: false, cmp: true, sort: 3 },
      { key: "ccSetAccuracy", g: "OUTPUT", zh: "CC 设定精度", en: "CC Set Accuracy", type: "string", imp: false, filt: false, cmp: true, sort: 4 },
      { key: "ccReadbackAccuracy", g: "OUTPUT", zh: "CC 回读精度", en: "CC Readback Accuracy", type: "string", imp: false, filt: false, cmp: true, sort: 5 },
      { key: "cvLineReg", g: "PERFORMANCE", zh: "CV 线性调整率", en: "CV Line Regulation", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
      { key: "cvLoadReg", g: "PERFORMANCE", zh: "CV 负载调整率", en: "CV Load Regulation", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
      { key: "cvRippleNoise", g: "PERFORMANCE", zh: "CV 纹波与噪声", en: "CV Ripple & Noise", type: "string", imp: true, filt: false, cmp: true, sort: 2 },
      { key: "cvRecoveryTime", g: "PERFORMANCE", zh: "CV 恢复时间", en: "CV Recovery Time", type: "string", imp: false, filt: false, cmp: true, sort: 3 },
      { key: "ccLineReg", g: "PERFORMANCE", zh: "CC 线性调整率", en: "CC Line Regulation", type: "string", imp: false, filt: false, cmp: true, sort: 4 },
      { key: "ccLoadReg", g: "PERFORMANCE", zh: "CC 负载调整率", en: "CC Load Regulation", type: "string", imp: false, filt: false, cmp: true, sort: 5 },
      { key: "ccRippleNoise", g: "PERFORMANCE", zh: "CC 纹波与噪声", en: "CC Ripple & Noise", type: "string", imp: false, filt: false, cmp: true, sort: 6 },
      { key: "tempCoefficient", g: "PERFORMANCE", zh: "温度系数", en: "Temperature Coefficient", type: "string", imp: false, filt: false, cmp: true, sort: 7 },
      { key: "memorySets", g: "FUNCTION", zh: "存储调用", en: "Memory Save/Recall", type: "string", imp: false, filt: false, cmp: false, sort: 0 },
      { key: "sequenceOutput", g: "FUNCTION", zh: "序列/定时输出", en: "Sequence/Timing Output", type: "string", imp: false, filt: false, cmp: false, sort: 1 },
      { key: "protection", g: "FUNCTION", zh: "保护功能", en: "Protection", type: "string", imp: false, filt: false, cmp: false, sort: 2 },
      { key: "trackingMode", g: "FUNCTION", zh: "跟踪模式", en: "Tracking Mode", type: "string", imp: false, filt: false, cmp: false, sort: 3 },
      { key: "ioInterface", g: "INTERFACE", zh: "IO 接口", en: "I/O Interface", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
      { key: "remoteControl", g: "INTERFACE", zh: "远程控制", en: "Remote Control", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
      { key: "powerSupply", g: "GENERAL", zh: "电源输入", en: "Power Supply", type: "string", imp: false, filt: false, cmp: false, sort: 0 },
      { key: "powerConsumption", g: "GENERAL", zh: "功耗", en: "Power Consumption", type: "string", imp: false, filt: false, cmp: false, sort: 1 },
      { key: "operatingTemp", g: "GENERAL", zh: "工作温度", en: "Operating Temperature", type: "string", imp: false, filt: false, cmp: false, sort: 2 },
      { key: "dimensions", g: "GENERAL", zh: "尺寸", en: "Dimensions", type: "string", imp: false, filt: false, cmp: false, sort: 3 },
      { key: "weight", g: "GENERAL", zh: "重量", en: "Weight", type: "string", imp: false, filt: false, cmp: false, sort: 4 },
    ],
  },
  {
    catCode: "SIGLENT-LOAD",
    groups: [
      { code: "BASIC", zh: "基本参数", en: "Basic Parameters", sort: 0 },
      { code: "PERFORMANCE", zh: "性能指标", en: "Performance", sort: 1 },
      { code: "DYNAMIC", zh: "动态特性", en: "Dynamic Characteristics", sort: 2 },
      { code: "INTERFACE", zh: "接口与显示", en: "Interface & Display", sort: 3 },
      { code: "GENERAL", zh: "通用规格", en: "General Specifications", sort: 4 },
    ],
    defs: [
      { key: "channels", g: "BASIC", zh: "通道数", en: "Channels", type: "enum", imp: true, filt: true, cmp: true, sort: 0 },
      { key: "maxInputVoltage", g: "BASIC", zh: "最大输入电压", en: "Max. Input Voltage", type: "enum", imp: true, filt: true, cmp: true, sort: 1 },
      { key: "maxInputCurrent", g: "BASIC", zh: "最大输入电流", en: "Max. Input Current", type: "enum", imp: true, filt: true, cmp: true, sort: 2 },
      { key: "maxPower", g: "BASIC", zh: "最大输入功率", en: "Max. Input Power", type: "enum", imp: true, filt: true, cmp: true, sort: 3 },
      { key: "modes", g: "BASIC", zh: "工作模式", en: "Operating Modes", type: "enum", imp: true, filt: true, cmp: true, sort: 4 },
      { key: "display", g: "BASIC", zh: "显示屏", en: "Display", type: "string", imp: false, filt: false, cmp: true, sort: 5 },
      { key: "voltageReadbackRes", g: "PERFORMANCE", zh: "电压回读分辨率", en: "Voltage Readback Resolution", type: "enum", imp: true, filt: false, cmp: true, sort: 0 },
      { key: "currentReadbackRes", g: "PERFORMANCE", zh: "电流回读分辨率", en: "Current Readback Resolution", type: "enum", imp: true, filt: false, cmp: true, sort: 1 },
      { key: "settingAccuracy", g: "PERFORMANCE", zh: "设定精度", en: "Setting Accuracy", type: "string", imp: false, filt: false, cmp: true, sort: 2 },
      { key: "minOperatingVoltage", g: "PERFORMANCE", zh: "最小操作电压", en: "Min. Operating Voltage", type: "string", imp: false, filt: false, cmp: true, sort: 3 },
      { key: "crRange", g: "PERFORMANCE", zh: "CR 电阻量程", en: "CR Range", type: "string", imp: false, filt: false, cmp: true, sort: 4 },
      { key: "crResolution", g: "PERFORMANCE", zh: "CR 分辨率", en: "CR Resolution", type: "string", imp: false, filt: false, cmp: true, sort: 5 },
      { key: "ccDynamicFreq", g: "DYNAMIC", zh: "CC 动态频率", en: "CC Dynamic Frequency", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
      { key: "cpDynamicFreq", g: "DYNAMIC", zh: "CP 动态频率", en: "CP Dynamic Frequency", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
      { key: "cvDynamicFreq", g: "DYNAMIC", zh: "CV 动态频率", en: "CV Dynamic Frequency", type: "string", imp: false, filt: false, cmp: true, sort: 2 },
      { key: "slewRate", g: "DYNAMIC", zh: "电流转换速率", en: "Current Slew Rate", type: "string", imp: false, filt: false, cmp: true, sort: 3 },
      { key: "ioInterface", g: "INTERFACE", zh: "IO 接口", en: "I/O Interface", type: "string", imp: false, filt: false, cmp: true, sort: 0 },
      { key: "remoteControl", g: "INTERFACE", zh: "远程控制", en: "Remote Control", type: "string", imp: false, filt: false, cmp: true, sort: 1 },
      { key: "powerSupply", g: "GENERAL", zh: "电源输入", en: "Power Supply", type: "string", imp: false, filt: false, cmp: false, sort: 0 },
      { key: "powerConsumption", g: "GENERAL", zh: "功耗", en: "Power Consumption", type: "string", imp: false, filt: false, cmp: false, sort: 1 },
      { key: "operatingTemp", g: "GENERAL", zh: "工作温度", en: "Operating Temperature", type: "string", imp: false, filt: false, cmp: false, sort: 2 },
      { key: "dimensions", g: "GENERAL", zh: "尺寸", en: "Dimensions", type: "string", imp: false, filt: false, cmp: false, sort: 3 },
      { key: "weight", g: "GENERAL", zh: "重量", en: "Weight", type: "string", imp: false, filt: false, cmp: false, sort: 4 },
    ],
  },
];

async function run() {
  const c = await new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  for (const t of TASKS) {
    const cat = await c.query(`SELECT id FROM "Category" WHERE code=$1`, [t.catCode]);
    if (!cat.rows[0]) { console.error("missing category:", t.catCode); continue; }
    const catId = cat.rows[0].id;
    console.log("=== category:", t.catCode, catId);
    const groupIds = new Map();
    for (const g of t.groups) {
      const r = await c.query(
        `INSERT INTO "ParamGroup" (id, "categoryId", code, "sortOrder", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,now(),now())
         ON CONFLICT ("categoryId", code) DO UPDATE SET "sortOrder"=EXCLUDED."sortOrder" RETURNING id`,
        [randomUUID(), catId, g.code, g.sort]
      );
      groupIds.set(g.code, r.rows[0].id);
      await c.query(`INSERT INTO "ParamGroupTranslation" (id,"paramGroupId",locale,name) VALUES ($1,$2,'zh',$3) ON CONFLICT ("paramGroupId",locale) DO UPDATE SET name=EXCLUDED.name`, [randomUUID(), r.rows[0].id, g.zh]);
      await c.query(`INSERT INTO "ParamGroupTranslation" (id,"paramGroupId",locale,name) VALUES ($1,$2,'en',$3) ON CONFLICT ("paramGroupId",locale) DO UPDATE SET name=EXCLUDED.name`, [randomUUID(), r.rows[0].id, g.en]);
    }
    let n = 0;
    for (const d of t.defs) {
      const r = await c.query(
        `INSERT INTO "ParamDefinition" (id,"categoryId","paramGroupId",key,type,unit,"isFilterable","isComparable","isRequired","isHighlight","sortOrder","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,NULL,$6,$7,false,$8,$9,now(),now())
         ON CONFLICT ("categoryId", key) DO UPDATE SET
           "paramGroupId"=EXCLUDED."paramGroupId", type=EXCLUDED.type, "isFilterable"=EXCLUDED."isFilterable",
           "isComparable"=EXCLUDED."isComparable", "isHighlight"=EXCLUDED."isHighlight", "sortOrder"=EXCLUDED."sortOrder"
         RETURNING id`,
        [randomUUID(), catId, groupIds.get(d.g), d.key, d.type, d.filt, d.cmp, d.imp, d.sort]
      );
      await c.query(`INSERT INTO "ParamDefinitionTranslation" (id,"paramDefinitionId",locale,name) VALUES ($1,$2,'zh',$3) ON CONFLICT ("paramDefinitionId",locale) DO UPDATE SET name=EXCLUDED.name`, [randomUUID(), r.rows[0].id, d.zh]);
      await c.query(`INSERT INTO "ParamDefinitionTranslation" (id,"paramDefinitionId",locale,name) VALUES ($1,$2,'en',$3) ON CONFLICT ("paramDefinitionId",locale) DO UPDATE SET name=EXCLUDED.name`, [randomUUID(), r.rows[0].id, d.en]);
      n++;
    }
    console.log("  groups:", t.groups.length, "defs:", n);
  }
  await c.end();
  console.log("DONE");
}
run().catch((e) => { console.error(e); process.exit(1); });
