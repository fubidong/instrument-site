// 其余品类完整参数模板（函数发生器/频谱/VNA/射频源/万用表/模块化/SMU/开关电源/源负载）
const { Client } = require("pg");
const { randomUUID } = require("crypto");

const D = (key, g, zh, en, type, imp, filt, cmp, sort) => ({ key, g, zh, en, type, imp, filt, cmp, sort });
const G = (code, zh, en, sort) => ({ code, zh, en, sort });

const TASKS = [
  {
    catCode: "SIGLENT-FUNCTION-GEN",
    groups: [G("BASIC", "基本参数", "Basic Parameters", 0), G("OUTPUT", "输出特性", "Output Characteristics", 1), G("MODULATION", "调制与功能", "Modulation & Functions", 2), G("INTERFACE", "接口与显示", "Interface & Display", 3), G("GENERAL", "通用规格", "General Specifications", 4)],
    defs: [
      D("channels", "BASIC", "通道数", "Channels", "enum", 1, 1, 1, 0),
      D("maxFrequency", "BASIC", "最大输出频率", "Max. Output Frequency", "enum", 1, 1, 1, 1),
      D("sampleRate", "BASIC", "采样率", "Sample Rate", "enum", 1, 1, 1, 2),
      D("verticalResolution", "BASIC", "垂直分辨率", "Vertical Resolution", "enum", 1, 1, 1, 3),
      D("outputTypes", "BASIC", "输出波形", "Output Waveforms", "string", 1, 0, 1, 4),
      D("maxAmplitude", "BASIC", "最大输出幅度", "Max. Output Amplitude", "string", 1, 0, 1, 5),
      D("frequencyAccuracy", "OUTPUT", "频率精度", "Frequency Accuracy", "string", 0, 0, 1, 0),
      D("amplitudeAccuracy", "OUTPUT", "幅度精度", "Amplitude Accuracy", "string", 0, 0, 1, 1),
      D("phaseRange", "OUTPUT", "相位范围", "Phase Range", "string", 0, 0, 1, 2),
      D("harmonicDistortion", "OUTPUT", "谐波失真", "Harmonic Distortion", "string", 0, 0, 1, 3),
      D("sfdr", "OUTPUT", "无杂散动态范围", "SFDR", "string", 0, 0, 1, 4),
      D("riseTime", "OUTPUT", "上升时间", "Rise Time", "string", 0, 0, 1, 5),
      D("pulseWidthRange", "OUTPUT", "脉宽范围", "Pulse Width Range", "string", 0, 0, 1, 6),
      D("modulation", "MODULATION", "调制功能", "Modulation", "string", 1, 0, 1, 0),
      D("sweep", "MODULATION", "扫频", "Sweep", "string", 0, 0, 1, 1),
      D("burst", "MODULATION", "猝发", "Burst", "string", 0, 0, 1, 2),
      D("channelCoupling", "MODULATION", "通道耦合", "Channel Coupling", "string", 0, 0, 1, 3),
      D("arbitraryDepth", "MODULATION", "任意波存储深度", "Arbitrary Waveform Depth", "string", 0, 0, 1, 4),
      D("ioInterface", "INTERFACE", "IO 接口", "I/O Interface", "string", 0, 0, 1, 0),
      D("remoteControl", "INTERFACE", "远程控制", "Remote Control", "string", 0, 0, 1, 1),
      D("displaySize", "INTERFACE", "显示屏", "Display", "string", 0, 0, 1, 2),
      D("powerSupply", "GENERAL", "电源输入", "Power Supply", "string", 0, 0, 0, 0),
      D("powerConsumption", "GENERAL", "功耗", "Power Consumption", "string", 0, 0, 0, 1),
      D("operatingTemp", "GENERAL", "工作温度", "Operating Temperature", "string", 0, 0, 0, 2),
      D("dimensions", "GENERAL", "尺寸", "Dimensions", "string", 0, 0, 0, 3),
      D("weight", "GENERAL", "重量", "Weight", "string", 0, 0, 0, 4),
    ],
  },
  {
    catCode: "SIGLENT-SPECTRUM",
    groups: [G("BASIC", "基本参数", "Basic Parameters", 0), G("PERFORMANCE", "性能指标", "Performance", 1), G("MEASUREMENT", "测量功能", "Measurement", 2), G("INTERFACE", "接口与显示", "Interface & Display", 3), G("GENERAL", "通用规格", "General Specifications", 4)],
    defs: [
      D("freqRange", "BASIC", "频率范围", "Frequency Range", "enum", 1, 1, 1, 0),
      D("minRbw", "BASIC", "最小分辨率带宽", "Min. RBW", "enum", 1, 1, 1, 1),
      D("danl", "BASIC", "显示平均噪声电平", "DANL", "string", 1, 0, 1, 2),
      D("phaseNoise", "BASIC", "相位噪声", "Phase Noise", "string", 1, 0, 1, 3),
      D("trackingSource", "BASIC", "跟踪源", "Tracking Generator", "string", 0, 0, 1, 4),
      D("rbwRange", "PERFORMANCE", "RBW 范围", "RBW Range", "string", 0, 0, 1, 0),
      D("spanAccuracy", "PERFORMANCE", "频标精度", "Marker Accuracy", "string", 0, 0, 1, 1),
      D("amplitudeAccuracy", "PERFORMANCE", "幅度精度", "Amplitude Accuracy", "string", 0, 0, 1, 2),
      D("frequencyAccuracy", "PERFORMANCE", "频率精度", "Frequency Accuracy", "string", 0, 0, 1, 3),
      D("spurious", "PERFORMANCE", "杂散响应", "Spurious Response", "string", 0, 0, 1, 4),
      D("displayRange", "PERFORMANCE", "显示范围", "Display Range", "string", 0, 0, 1, 5),
      D("measurementFunctions", "MEASUREMENT", "测量功能", "Measurement Functions", "string", 1, 0, 1, 0),
      D("markers", "MEASUREMENT", "标记功能", "Markers", "string", 0, 0, 1, 1),
      D("demodulation", "MEASUREMENT", "解调功能", "Demodulation", "string", 0, 0, 1, 2),
      D("ioInterface", "INTERFACE", "IO 接口", "I/O Interface", "string", 0, 0, 1, 0),
      D("remoteControl", "INTERFACE", "远程控制", "Remote Control", "string", 0, 0, 1, 1),
      D("displaySize", "INTERFACE", "显示屏", "Display", "string", 0, 0, 1, 2),
      D("powerSupply", "GENERAL", "电源输入", "Power Supply", "string", 0, 0, 0, 0),
      D("powerConsumption", "GENERAL", "功耗", "Power Consumption", "string", 0, 0, 0, 1),
      D("operatingTemp", "GENERAL", "工作温度", "Operating Temperature", "string", 0, 0, 0, 2),
      D("dimensions", "GENERAL", "尺寸", "Dimensions", "string", 0, 0, 0, 3),
      D("weight", "GENERAL", "重量", "Weight", "string", 0, 0, 0, 4),
    ],
  },
  {
    catCode: "SIGLENT-VNA",
    groups: [G("BASIC", "基本参数", "Basic Parameters", 0), G("PERFORMANCE", "性能指标", "Performance", 1), G("MEASUREMENT", "测量功能", "Measurement", 2), G("INTERFACE", "接口与显示", "Interface & Display", 3), G("GENERAL", "通用规格", "General Specifications", 4)],
    defs: [
      D("freqRange", "BASIC", "频率范围", "Frequency Range", "enum", 1, 1, 1, 0),
      D("ports", "BASIC", "端口数", "Ports", "enum", 1, 1, 1, 1),
      D("sweepPoints", "BASIC", "扫描点数", "Sweep Points", "enum", 0, 1, 1, 2),
      D("ifBandwidth", "BASIC", "IF 带宽范围", "IF Bandwidth", "string", 0, 0, 1, 3),
      D("dynamicRange", "PERFORMANCE", "动态范围", "Dynamic Range", "string", 1, 0, 1, 0),
      D("traceNoise", "PERFORMANCE", "迹线噪声", "Trace Noise", "string", 0, 0, 1, 1),
      D("outputPower", "PERFORMANCE", "输出功率范围", "Output Power Range", "string", 0, 0, 1, 2),
      D("directivity", "PERFORMANCE", "方向性", "Directivity", "string", 0, 0, 1, 3),
      D("measurementParams", "MEASUREMENT", "测量参数", "Measurement Parameters", "string", 1, 0, 1, 0),
      D("calibration", "MEASUREMENT", "校准功能", "Calibration", "string", 0, 0, 1, 1),
      D("timeDomain", "MEASUREMENT", "时域功能", "Time Domain", "string", 0, 0, 1, 2),
      D("ioInterface", "INTERFACE", "IO 接口", "I/O Interface", "string", 0, 0, 1, 0),
      D("remoteControl", "INTERFACE", "远程控制", "Remote Control", "string", 0, 0, 1, 1),
      D("displaySize", "INTERFACE", "显示屏", "Display", "string", 0, 0, 1, 2),
      D("powerSupply", "GENERAL", "电源输入", "Power Supply", "string", 0, 0, 0, 0),
      D("powerConsumption", "GENERAL", "功耗", "Power Consumption", "string", 0, 0, 0, 1),
      D("operatingTemp", "GENERAL", "工作温度", "Operating Temperature", "string", 0, 0, 0, 2),
      D("dimensions", "GENERAL", "尺寸", "Dimensions", "string", 0, 0, 0, 3),
      D("weight", "GENERAL", "重量", "Weight", "string", 0, 0, 0, 4),
    ],
  },
  {
    catCode: "SIGLENT-RF-GEN",
    groups: [G("BASIC", "基本参数", "Basic Parameters", 0), G("PERFORMANCE", "性能指标", "Performance", 1), G("MODULATION", "调制功能", "Modulation", 2), G("INTERFACE", "接口与显示", "Interface & Display", 3), G("GENERAL", "通用规格", "General Specifications", 4)],
    defs: [
      D("freqRange", "BASIC", "频率范围", "Frequency Range", "enum", 1, 1, 1, 0),
      D("outputPower", "BASIC", "输出功率范围", "Output Power Range", "string", 1, 0, 1, 1),
      D("phaseNoise", "BASIC", "相位噪声", "Phase Noise", "string", 1, 0, 1, 2),
      D("freqResolution", "BASIC", "频率分辨率", "Frequency Resolution", "string", 0, 0, 1, 3),
      D("amplitudeAccuracy", "PERFORMANCE", "幅度精度", "Amplitude Accuracy", "string", 0, 0, 1, 0),
      D("harmonics", "PERFORMANCE", "谐波", "Harmonics", "string", 0, 0, 1, 1),
      D("nonHarmonicSpurious", "PERFORMANCE", "非谐波杂散", "Non-harmonic Spurious", "string", 0, 0, 1, 2),
      D("switchingSpeed", "PERFORMANCE", "切换速度", "Switching Speed", "string", 0, 0, 1, 3),
      D("modulation", "MODULATION", "调制功能", "Modulation", "string", 1, 0, 1, 0),
      D("pulseModulation", "MODULATION", "脉冲调制", "Pulse Modulation", "string", 0, 0, 1, 1),
      D("ioInterface", "INTERFACE", "IO 接口", "I/O Interface", "string", 0, 0, 1, 0),
      D("remoteControl", "INTERFACE", "远程控制", "Remote Control", "string", 0, 0, 1, 1),
      D("displaySize", "INTERFACE", "显示屏", "Display", "string", 0, 0, 1, 2),
      D("powerSupply", "GENERAL", "电源输入", "Power Supply", "string", 0, 0, 0, 0),
      D("powerConsumption", "GENERAL", "功耗", "Power Consumption", "string", 0, 0, 0, 1),
      D("operatingTemp", "GENERAL", "工作温度", "Operating Temperature", "string", 0, 0, 0, 2),
      D("dimensions", "GENERAL", "尺寸", "Dimensions", "string", 0, 0, 0, 3),
      D("weight", "GENERAL", "重量", "Weight", "string", 0, 0, 0, 4),
    ],
  },
  {
    catCode: "SIGLENT-MULTIMETER",
    groups: [G("BASIC", "基本参数", "Basic Parameters", 0), G("MEASUREMENT", "测量量程", "Measurement Ranges", 1), G("PERFORMANCE", "性能指标", "Performance", 2), G("INTERFACE", "接口与显示", "Interface & Display", 3), G("GENERAL", "通用规格", "General Specifications", 4)],
    defs: [
      D("displayDigits", "BASIC", "显示位数", "Display Digits", "enum", 1, 1, 1, 0),
      D("measurementFunctions", "BASIC", "测量功能", "Measurement Functions", "string", 1, 0, 1, 1),
      D("dcVoltageRange", "BASIC", "DC 电压量程", "DC Voltage Range", "string", 1, 0, 1, 2),
      D("maxReadRate", "BASIC", "最高读数率", "Max. Reading Rate", "string", 0, 0, 1, 3),
      D("dcVoltageAccuracy", "BASIC", "DC 电压精度", "DC Voltage Accuracy", "string", 1, 0, 1, 4),
      D("acVoltageRange", "MEASUREMENT", "AC 电压量程", "AC Voltage Range", "string", 0, 0, 1, 0),
      D("dcCurrentRange", "MEASUREMENT", "DC 电流量程", "DC Current Range", "string", 0, 0, 1, 1),
      D("acCurrentRange", "MEASUREMENT", "AC 电流量程", "AC Current Range", "string", 0, 0, 1, 2),
      D("resistanceRange", "MEASUREMENT", "电阻量程", "Resistance Range", "string", 0, 0, 1, 3),
      D("frequencyRange", "MEASUREMENT", "频率量程", "Frequency Range", "string", 0, 0, 1, 4),
      D("temperatureRange", "MEASUREMENT", "温度量程", "Temperature Range", "string", 0, 0, 1, 5),
      D("acVoltageAccuracy", "PERFORMANCE", "AC 电压精度", "AC Voltage Accuracy", "string", 0, 0, 1, 0),
      D("resistanceAccuracy", "PERFORMANCE", "电阻精度", "Resistance Accuracy", "string", 0, 0, 1, 1),
      D("resolution", "PERFORMANCE", "分辨率", "Resolution", "string", 0, 0, 1, 2),
      D("ioInterface", "INTERFACE", "IO 接口", "I/O Interface", "string", 0, 0, 1, 0),
      D("remoteControl", "INTERFACE", "远程控制", "Remote Control", "string", 0, 0, 1, 1),
      D("displaySize", "INTERFACE", "显示屏", "Display", "string", 0, 0, 1, 2),
      D("powerSupply", "GENERAL", "电源输入", "Power Supply", "string", 0, 0, 0, 0),
      D("powerConsumption", "GENERAL", "功耗", "Power Consumption", "string", 0, 0, 0, 1),
      D("operatingTemp", "GENERAL", "工作温度", "Operating Temperature", "string", 0, 0, 0, 2),
      D("dimensions", "GENERAL", "尺寸", "Dimensions", "string", 0, 0, 0, 3),
      D("weight", "GENERAL", "重量", "Weight", "string", 0, 0, 0, 4),
    ],
  },
  {
    catCode: "SIGLENT-MODULAR",
    groups: [G("BASIC", "基本参数", "Basic Parameters", 0), G("INTERFACE", "接口与显示", "Interface & Display", 1), G("GENERAL", "通用规格", "General Specifications", 2)],
    defs: [
      D("moduleType", "BASIC", "模块类型", "Module Type", "string", 1, 0, 1, 0),
      D("channels", "BASIC", "通道数", "Channels", "enum", 1, 1, 1, 1),
      D("bandwidth", "BASIC", "带宽", "Bandwidth", "enum", 1, 1, 1, 2),
      D("sampleRate", "BASIC", "采样率", "Sample Rate", "string", 1, 1, 1, 3),
      D("verticalResolution", "BASIC", "垂直分辨率", "Vertical Resolution", "string", 0, 0, 1, 4),
      D("storageDepth", "BASIC", "存储深度", "Record Length", "string", 0, 0, 1, 5),
      D("ioInterface", "INTERFACE", "总线接口", "Bus Interface", "string", 0, 0, 1, 0),
      D("operatingTemp", "GENERAL", "工作温度", "Operating Temperature", "string", 0, 0, 0, 0),
      D("dimensions", "GENERAL", "尺寸", "Dimensions", "string", 0, 0, 0, 1),
      D("weight", "GENERAL", "重量", "Weight", "string", 0, 0, 0, 2),
    ],
  },
  {
    catCode: "SIGLENT-SMU",
    groups: [G("BASIC", "基本参数", "Basic Parameters", 0), G("PERFORMANCE", "性能指标", "Performance", 1), G("INTERFACE", "接口与显示", "Interface & Display", 2), G("GENERAL", "通用规格", "General Specifications", 3)],
    defs: [
      D("channels", "BASIC", "通道数", "Channels", "enum", 1, 1, 1, 0),
      D("voltageRange", "BASIC", "电压范围", "Voltage Range", "enum", 1, 1, 1, 1),
      D("currentRange", "BASIC", "电流范围", "Current Range", "enum", 1, 1, 1, 2),
      D("powerRange", "BASIC", "功率范围", "Power Range", "enum", 1, 1, 1, 3),
      D("resolution", "BASIC", "分辨率", "Resolution", "string", 0, 0, 1, 4),
      D("modes", "BASIC", "工作模式", "Operating Modes", "string", 0, 0, 1, 5),
      D("voltageAccuracy", "PERFORMANCE", "电压精度", "Voltage Accuracy", "string", 1, 0, 1, 0),
      D("currentAccuracy", "PERFORMANCE", "电流精度", "Current Accuracy", "string", 1, 0, 1, 1),
      D("ioInterface", "INTERFACE", "IO 接口", "I/O Interface", "string", 0, 0, 1, 0),
      D("remoteControl", "INTERFACE", "远程控制", "Remote Control", "string", 0, 0, 1, 1),
      D("displaySize", "INTERFACE", "显示屏", "Display", "string", 0, 0, 1, 2),
      D("powerSupply", "GENERAL", "电源输入", "Power Supply", "string", 0, 0, 0, 0),
      D("powerConsumption", "GENERAL", "功耗", "Power Consumption", "string", 0, 0, 0, 1),
      D("operatingTemp", "GENERAL", "工作温度", "Operating Temperature", "string", 0, 0, 0, 2),
      D("dimensions", "GENERAL", "尺寸", "Dimensions", "string", 0, 0, 0, 3),
      D("weight", "GENERAL", "重量", "Weight", "string", 0, 0, 0, 4),
    ],
  },
  {
    catCode: "SIGLENT-SWITCH-POWER",
    groups: [G("BASIC", "基本参数", "Basic Parameters", 0), G("PERFORMANCE", "性能指标", "Performance", 1), G("FUNCTION", "功能特性", "Functions", 2), G("INTERFACE", "接口与显示", "Interface & Display", 3), G("GENERAL", "通用规格", "General Specifications", 4)],
    defs: [
      D("channels", "BASIC", "输出通道数", "Output Channels", "enum", 1, 1, 1, 0),
      D("voltageRange", "BASIC", "输出电压范围", "Output Voltage Range", "string", 1, 1, 1, 1),
      D("currentRange", "BASIC", "输出电流范围", "Output Current Range", "string", 1, 1, 1, 2),
      D("maxPower", "BASIC", "最大输出功率", "Max. Output Power", "enum", 1, 1, 1, 3),
      D("voltageResolution", "BASIC", "电压分辨率", "Voltage Resolution", "string", 0, 0, 1, 4),
      D("currentResolution", "BASIC", "电流分辨率", "Current Resolution", "string", 0, 0, 1, 5),
      D("rippleNoise", "PERFORMANCE", "纹波与噪声", "Ripple & Noise", "string", 1, 0, 1, 0),
      D("lineReg", "PERFORMANCE", "线性调整率", "Line Regulation", "string", 0, 0, 1, 1),
      D("loadReg", "PERFORMANCE", "负载调整率", "Load Regulation", "string", 0, 0, 1, 2),
      D("setAccuracy", "PERFORMANCE", "设定精度", "Set Accuracy", "string", 0, 0, 1, 3),
      D("sequenceOutput", "FUNCTION", "序列输出", "Sequence Output", "string", 0, 0, 0, 0),
      D("protection", "FUNCTION", "保护功能", "Protection", "string", 0, 0, 0, 1),
      D("ioInterface", "INTERFACE", "IO 接口", "I/O Interface", "string", 0, 0, 1, 0),
      D("remoteControl", "INTERFACE", "远程控制", "Remote Control", "string", 0, 0, 1, 1),
      D("displaySize", "INTERFACE", "显示屏", "Display", "string", 0, 0, 1, 2),
      D("powerSupply", "GENERAL", "电源输入", "Power Supply", "string", 0, 0, 0, 0),
      D("powerConsumption", "GENERAL", "功耗", "Power Consumption", "string", 0, 0, 0, 1),
      D("operatingTemp", "GENERAL", "工作温度", "Operating Temperature", "string", 0, 0, 0, 2),
      D("dimensions", "GENERAL", "尺寸", "Dimensions", "string", 0, 0, 0, 3),
      D("weight", "GENERAL", "重量", "Weight", "string", 0, 0, 0, 4),
    ],
  },
  {
    catCode: "SIGLENT-SOURCE-LOAD",
    groups: [G("BASIC", "基本参数", "Basic Parameters", 0), G("PERFORMANCE", "性能指标", "Performance", 1), G("INTERFACE", "接口与显示", "Interface & Display", 2), G("GENERAL", "通用规格", "General Specifications", 3)],
    defs: [
      D("channels", "BASIC", "通道数", "Channels", "enum", 1, 1, 1, 0),
      D("voltageRange", "BASIC", "电压范围", "Voltage Range", "enum", 1, 1, 1, 1),
      D("currentRange", "BASIC", "电流范围", "Current Range", "enum", 1, 1, 1, 2),
      D("powerRange", "BASIC", "功率范围", "Power Range", "enum", 1, 1, 1, 3),
      D("modes", "BASIC", "工作模式", "Operating Modes", "string", 1, 0, 1, 4),
      D("voltageAccuracy", "PERFORMANCE", "电压精度", "Voltage Accuracy", "string", 0, 0, 1, 0),
      D("currentAccuracy", "PERFORMANCE", "电流精度", "Current Accuracy", "string", 0, 0, 1, 1),
      D("rippleNoise", "PERFORMANCE", "纹波与噪声", "Ripple & Noise", "string", 0, 0, 1, 2),
      D("ioInterface", "INTERFACE", "IO 接口", "I/O Interface", "string", 0, 0, 1, 0),
      D("remoteControl", "INTERFACE", "远程控制", "Remote Control", "string", 0, 0, 1, 1),
      D("displaySize", "INTERFACE", "显示屏", "Display", "string", 0, 0, 1, 2),
      D("powerSupply", "GENERAL", "电源输入", "Power Supply", "string", 0, 0, 0, 0),
      D("powerConsumption", "GENERAL", "功耗", "Power Consumption", "string", 0, 0, 0, 1),
      D("operatingTemp", "GENERAL", "工作温度", "Operating Temperature", "string", 0, 0, 0, 2),
      D("dimensions", "GENERAL", "尺寸", "Dimensions", "string", 0, 0, 0, 3),
      D("weight", "GENERAL", "重量", "Weight", "string", 0, 0, 0, 4),
    ],
  },
];

async function run() {
  const c = await new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  let totalGroups = 0, totalDefs = 0;
  for (const t of TASKS) {
    const cat = await c.query(`SELECT id FROM "Category" WHERE code=$1`, [t.catCode]);
    if (!cat.rows[0]) { console.error("missing category:", t.catCode); continue; }
    const catId = cat.rows[0].id;
    const groupIds = new Map();
    for (const g of t.groups) {
      const r = await c.query(
        `INSERT INTO "ParamGroup" (id,"categoryId",code,"sortOrder","createdAt","updatedAt") VALUES ($1,$2,$3,$4,now(),now())
         ON CONFLICT ("categoryId",code) DO UPDATE SET "sortOrder"=EXCLUDED."sortOrder" RETURNING id`,
        [randomUUID(), catId, g.code, g.sort]
      );
      groupIds.set(g.code, r.rows[0].id);
      await c.query(`INSERT INTO "ParamGroupTranslation" (id,"paramGroupId",locale,name) VALUES ($1,$2,'zh',$3) ON CONFLICT ("paramGroupId",locale) DO UPDATE SET name=EXCLUDED.name`, [randomUUID(), r.rows[0].id, g.zh]);
      await c.query(`INSERT INTO "ParamGroupTranslation" (id,"paramGroupId",locale,name) VALUES ($1,$2,'en',$3) ON CONFLICT ("paramGroupId",locale) DO UPDATE SET name=EXCLUDED.name`, [randomUUID(), r.rows[0].id, g.en]);
      totalGroups++;
    }
    let n = 0;
    for (const d of t.defs) {
      const r = await c.query(
        `INSERT INTO "ParamDefinition" (id,"categoryId","paramGroupId",key,type,unit,"isFilterable","isComparable","isRequired","isHighlight","sortOrder","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,NULL,$6,$7,false,$8,$9,now(),now())
         ON CONFLICT ("categoryId",key) DO UPDATE SET
           "paramGroupId"=EXCLUDED."paramGroupId", type=EXCLUDED.type, "isFilterable"=EXCLUDED."isFilterable",
           "isComparable"=EXCLUDED."isComparable", "isHighlight"=EXCLUDED."isHighlight", "sortOrder"=EXCLUDED."sortOrder"
         RETURNING id`,
        [randomUUID(), catId, groupIds.get(d.g), d.key, d.type, d.filt, d.cmp, d.imp, d.sort]
      );
      await c.query(`INSERT INTO "ParamDefinitionTranslation" (id,"paramDefinitionId",locale,name) VALUES ($1,$2,'zh',$3) ON CONFLICT ("paramDefinitionId",locale) DO UPDATE SET name=EXCLUDED.name`, [randomUUID(), r.rows[0].id, d.zh]);
      await c.query(`INSERT INTO "ParamDefinitionTranslation" (id,"paramDefinitionId",locale,name) VALUES ($1,$2,'en',$3) ON CONFLICT ("paramDefinitionId",locale) DO UPDATE SET name=EXCLUDED.name`, [randomUUID(), r.rows[0].id, d.en]);
      n++; totalDefs++;
    }
    console.log(t.catCode.padEnd(22), "groups=" + t.groups.length, "defs=" + n);
  }
  await c.end();
  console.log("DONE. total groups:", totalGroups, "defs:", totalDefs);
}
run().catch((e) => { console.error(e); process.exit(1); });
