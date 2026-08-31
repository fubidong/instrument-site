// 建类别树 + 品牌分类关联 + 各产品线参数模板
// 幂等：按 code upsert
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BRAND_CODE = "SIGLENT";

// 类别定义：code -> { zh, en, parent }
const CATS = [
  { code: "OSCILLOSCOPE", zh: "示波器", en: "Oscilloscopes", parent: null },
  { code: "HI-RES-OSC", zh: "高分辨率示波器", en: "High-resolution Oscilloscopes", parent: "OSCILLOSCOPE" },
  { code: "DIGITAL-OSC", zh: "数字示波器", en: "Digital Oscilloscopes", parent: "OSCILLOSCOPE" },
  { code: "HANDHELD-OSC", zh: "手持示波表", en: "Handheld Oscilloscopes", parent: "OSCILLOSCOPE" },
  { code: "COMPACT-OSC", zh: "紧凑型示波器", en: "Compact Oscilloscopes", parent: "OSCILLOSCOPE" },

  { code: "FUNCTION_GEN", zh: "函数/任意波形发生器", en: "Function / Arbitrary Waveform Generators", parent: null },
  { code: "SPECTRUM", zh: "频谱分析仪", en: "Spectrum Analyzers", parent: null },
  { code: "VNA", zh: "矢量网络分析仪", en: "Vector Network Analyzers", parent: null },
  { code: "RF_GEN", zh: "射频/微波信号发生器", en: "RF / Microwave Signal Generators", parent: null },

  { code: "POWER", zh: "直流电源/源表", en: "DC Power Supplies & SMUs", parent: null },
  { code: "LINEAR-POWER", zh: "线性电源", en: "Linear Power Supplies", parent: "POWER" },
  { code: "SWITCH-POWER", zh: "开关电源", en: "Switching Power Supplies", parent: "POWER" },
  { code: "SMU", zh: "源测量单元", en: "Source Measure Units", parent: "POWER" },
  { code: "SOURCE-LOAD", zh: "源载模拟器", en: "Source-Load Simulators", parent: "POWER" },

  { code: "LOAD", zh: "电子负载", en: "Electronic Loads", parent: null },
  { code: "MULTIMETER", zh: "数字万用表", en: "Digital Multimeters", parent: null },
  { code: "MODULAR", zh: "模块化仪器", en: "Modular Instruments", parent: null },
];

// 参数模板：category code -> { group, defs[] }
// type: number|range|enum|boolean|string；options 用于 enum
const PARAM_TEMPLATES: Record<string, { group: { code: string; zh: string; en: string }; defs: any[] }> = {
  OSCILLOSCOPE: {
    group: { code: "BASIC", zh: "基本参数", en: "Basic" },
    defs: [
      { key: "bandwidth", zh: "模拟带宽", en: "Bandwidth", type: "string", filterable: true, comparable: true, highlight: true },
      { key: "channels", zh: "通道数", en: "Channels", type: "string", filterable: true, comparable: true },
      { key: "sampleRate", zh: "最高实时采样率", en: "Sample Rate", type: "string", filterable: true, comparable: true },
      { key: "verticalResolution", zh: "垂直分辨率", en: "Vertical Resolution", type: "string", filterable: true, comparable: true },
      { key: "storageDepth", zh: "最大存储深度", en: "Storage Depth", type: "string", filterable: true, comparable: true },
      { key: "waveformRate", zh: "最高波形捕获率", en: "Waveform Capture Rate", type: "string", comparable: true },
    ],
  },
  FUNCTION_GEN: {
    group: { code: "BASIC", zh: "基本参数", en: "Basic" },
    defs: [
      { key: "maxFreq", zh: "最高输出频率", en: "Max Output Frequency", type: "string", filterable: true, comparable: true, highlight: true },
      { key: "sampleRate", zh: "最高采样率", en: "Sample Rate", type: "string", filterable: true, comparable: true },
      { key: "verticalResolution", zh: "垂直分辨率", en: "Vertical Resolution", type: "string", filterable: true, comparable: true },
      { key: "arbLength", zh: "任意波长度", en: "Arbitrary Waveform Length", type: "string", filterable: true, comparable: true },
      { key: "channels", zh: "通道数", en: "Channels", type: "string", filterable: true, comparable: true },
    ],
  },
  SPECTRUM: {
    group: { code: "BASIC", zh: "基本参数", en: "Basic" },
    defs: [
      { key: "freqRange", zh: "频率范围", en: "Frequency Range", type: "string", filterable: true, comparable: true, highlight: true },
      { key: "realTimeBW", zh: "最大实时带宽", en: "Max Real-time Bandwidth", type: "string", filterable: true, comparable: true },
      { key: "phaseNoise", zh: "相位噪声(典型值)", en: "Phase Noise (typ.)", type: "string", comparable: true },
      { key: "danl", zh: "显示平均噪声电平(DANL)", en: "DANL", type: "string", comparable: true },
      { key: "rbw", zh: "分辨率带宽(RBW)", en: "RBW", type: "string", comparable: true },
    ],
  },
  VNA: {
    group: { code: "BASIC", zh: "基本参数", en: "Basic" },
    defs: [
      { key: "freqRange", zh: "测量频率范围", en: "Frequency Range", type: "string", filterable: true, comparable: true, highlight: true },
      { key: "ports", zh: "端口数", en: "Ports", type: "string", filterable: true, comparable: true },
      { key: "dynamicRange", zh: "动态范围", en: "Dynamic Range", type: "string", filterable: true, comparable: true },
      { key: "outputPower", zh: "输出功率设置范围", en: "Output Power Range", type: "string", comparable: true },
    ],
  },
  RF_GEN: {
    group: { code: "BASIC", zh: "基本参数", en: "Basic" },
    defs: [
      { key: "freqRange", zh: "频率范围", en: "Frequency Range", type: "string", filterable: true, comparable: true, highlight: true },
      { key: "maxOutputPower", zh: "最大输出功率", en: "Max Output Power", type: "string", filterable: true, comparable: true },
      { key: "phaseNoise", zh: "相位噪声", en: "Phase Noise", type: "string", comparable: true },
      { key: "iqMod", zh: "IQ调制", en: "IQ Modulation", type: "boolean", filterable: true },
      { key: "freqRes", zh: "频率分辨率", en: "Frequency Resolution", type: "string", comparable: true },
    ],
  },
  POWER: {
    group: { code: "BASIC", zh: "基本参数", en: "Basic" },
    defs: [
      { key: "maxVoltage", zh: "最大单路输出电压", en: "Max Output Voltage", type: "string", filterable: true, comparable: true, highlight: true },
      { key: "maxCurrent", zh: "最大单路输出电流", en: "Max Output Current", type: "string", filterable: true, comparable: true },
      { key: "outputPower", zh: "最大输出功率", en: "Max Output Power", type: "string", filterable: true, comparable: true },
      { key: "channels", zh: "通道数", en: "Channels", type: "string", filterable: true, comparable: true },
      { key: "resolution", zh: "分辨率", en: "Resolution", type: "string", comparable: true },
    ],
  },
  LOAD: {
    group: { code: "BASIC", zh: "基本参数", en: "Basic" },
    defs: [
      { key: "voltage", zh: "电压", en: "Voltage", type: "string", filterable: true, comparable: true, highlight: true },
      { key: "current", zh: "电流", en: "Current", type: "string", filterable: true, comparable: true },
      { key: "power", zh: "总功率", en: "Power", type: "string", filterable: true, comparable: true },
      { key: "channels", zh: "通道数", en: "Channels", type: "string", filterable: true, comparable: true },
    ],
  },
  MULTIMETER: {
    group: { code: "BASIC", zh: "基本参数", en: "Basic" },
    defs: [
      { key: "resolution", zh: "读数分辨率", en: "Reading Resolution", type: "string", filterable: true, comparable: true, highlight: true },
      { key: "sampleRate", zh: "最大采样速率", en: "Max Sampling Rate", type: "string", filterable: true, comparable: true },
      { key: "dcAccuracy", zh: "DCV基本精度", en: "DCV Accuracy", type: "string", comparable: true },
      { key: "nplc", zh: "NPLC", en: "NPLC", type: "string", comparable: true },
      { key: "scanCard", zh: "扫描卡", en: "Scan Card", type: "boolean", filterable: true },
    ],
  },
  MODULAR: {
    group: { code: "BASIC", zh: "基本参数", en: "Basic" },
    defs: [
      { key: "type", zh: "类型", en: "Type", type: "string", filterable: true },
      { key: "channels", zh: "通道数", en: "Channels", type: "string", filterable: true, comparable: true },
    ],
  },
};

// 每个系列的产品线映射（决定归到哪个子类）
// 从官网数据自动映射：用 products 的 categories 名匹配子类
const CAT_NAME_MAP: Record<string, string> = {
  高分辨率示波器: "HI-RES-OSC",
  数字示波器: "DIGITAL-OSC",
  手持示波表: "HANDHELD-OSC",
  紧凑型示波器: "COMPACT-OSC",
  线性电源: "LINEAR-POWER",
  开关电源: "SWITCH-POWER",
  源测量单元: "SMU",
  源载模拟器: "SOURCE-LOAD",
};

async function main() {
  const brand = await prisma.brand.findUnique({ where: { code: BRAND_CODE } });
  if (!brand) throw new Error("brand not found");

  // 1. 建类别树
  const catIds: Record<string, string> = {};
  for (const c of CATS) {
    const parentId = c.parent ? catIds[c.parent] : null;
    const cat = await prisma.category.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        parentId,
        translations: {
          create: [
            { locale: "zh", name: c.zh },
            { locale: "en", name: c.en },
          ],
        },
      },
      update: { parentId },
    });
    catIds[c.code] = cat.id;
    // 确保翻译存在
    for (const [locale, name] of [
      ["zh", c.zh],
      ["en", c.en],
    ] as const) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: cat.id, locale } },
        create: { categoryId: cat.id, locale, name },
        update: { name },
      });
    }
    // 品牌-类别关联
    await prisma.brandCategory.upsert({
      where: { brandId_categoryId: { brandId: brand.id, categoryId: cat.id } },
      create: { brandId: brand.id, categoryId: cat.id },
      update: {},
    });
    console.log("cat", c.code, "ok");
  }

  // 2. 建参数模板
  for (const [catCode, tpl] of Object.entries(PARAM_TEMPLATES)) {
    const categoryId = catIds[catCode];
    const group = await prisma.paramGroup.upsert({
      where: { categoryId_code: { categoryId, code: tpl.group.code } },
      create: {
        categoryId,
        code: tpl.group.code,
        translations: {
          create: [
            { locale: "zh", name: tpl.group.zh },
            { locale: "en", name: tpl.group.en },
          ],
        },
      },
      update: {},
    });
    for (const [locale, name] of [
      ["zh", tpl.group.zh],
      ["en", tpl.group.en],
    ] as const) {
      await prisma.paramGroupTranslation.upsert({
        where: { paramGroupId_locale: { paramGroupId: group.id, locale } },
        create: { paramGroupId: group.id, locale, name },
        update: { name },
      });
    }
    let i = 0;
    for (const d of tpl.defs) {
      const def = await prisma.paramDefinition.upsert({
        where: { categoryId_key: { categoryId, key: d.key } },
        create: {
          categoryId,
          paramGroupId: group.id,
          key: d.key,
          type: d.type,
          isFilterable: d.filterable,
          isComparable: d.comparable,
          isHighlight: d.highlight,
          sortOrder: i,
          translations: {
            create: [
              { locale: "zh", name: d.zh },
              { locale: "en", name: d.en },
            ],
          },
        },
        update: { paramGroupId: group.id, type: d.type, isFilterable: d.filterable, isComparable: d.comparable, isHighlight: d.highlight, sortOrder: i },
      });
      for (const [locale, name] of [
        ["zh", d.zh],
        ["en", d.en],
      ] as const) {
        await prisma.paramDefinitionTranslation.upsert({
          where: { paramDefinitionId_locale: { paramDefinitionId: def.id, locale } },
          create: { paramDefinitionId: def.id, locale, name },
          update: { name },
        });
      }
      i++;
    }
    console.log("params", catCode, "ok");
  }

  // 3. 输出映射表供导入脚本使用
  console.log("CAT_IDS", JSON.stringify(catIds));
  console.log("BRAND_ID", brand.id);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
