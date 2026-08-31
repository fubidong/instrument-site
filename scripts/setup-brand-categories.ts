// 建鼎阳品牌分类树（品牌站导航），挂 siteCategoryId 关联到全站品类
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BRAND_ID = "2235b359-3d5c-4dcc-b763-3ea81273fd22"; // SIGLENT

async function main() {
  // 全站品类 code → id（从 DB 查，不硬编码）
  const siteCats = await prisma.category.findMany({ where: { brandId: null } });
  const siteByCode = new Map(siteCats.map((c) => [c.code, c.id]));
  console.log("全站品类:", siteByCode.size);

  // 鼎阳品牌分类树定义
  // [code, 中文名, 英文名, parentCode|null, siteCategoryCode]
  const TREE = [
    ["SIGLENT-OSCILLOSCOPE", "示波器", "Oscilloscopes", null, "OSCILLOSCOPE"],
    ["SIGLENT-HI-RES-OSC", "高分辨率示波器", "High-resolution Oscilloscopes", "SIGLENT-OSCILLOSCOPE", "HI-RES-OSC"],
    ["SIGLENT-DIGITAL-OSC", "数字示波器", "Digital Oscilloscopes", "SIGLENT-OSCILLOSCOPE", "DIGITAL-OSC"],
    ["SIGLENT-HANDHELD-OSC", "手持示波表", "Handheld Oscilloscopes", "SIGLENT-OSCILLOSCOPE", "HANDHELD-OSC"],
    ["SIGLENT-COMPACT-OSC", "紧凑型示波器", "Compact Oscilloscopes", "SIGLENT-OSCILLOSCOPE", "COMPACT-OSC"],
    ["SIGLENT-FUNCTION-GEN", "函数/任意波形发生器", "Function / Arbitrary Waveform Generators", null, "FUNCTION_GEN"],
    ["SIGLENT-SPECTRUM", "频谱分析仪", "Spectrum Analyzers", null, "SPECTRUM"],
    ["SIGLENT-VNA", "矢量网络分析仪", "Vector Network Analyzers", null, "VNA"],
    ["SIGLENT-RF-GEN", "射频/微波信号发生器", "RF / Microwave Signal Generators", null, "RF_GEN"],
    ["SIGLENT-POWER", "直流电源/源表", "DC Power Supplies & SMUs", null, "POWER"],
    ["SIGLENT-LINEAR-POWER", "线性电源", "Linear Power Supplies", "SIGLENT-POWER", "LINEAR-POWER"],
    ["SIGLENT-SWITCH-POWER", "开关电源", "Switching Power Supplies", "SIGLENT-POWER", "SWITCH-POWER"],
    ["SIGLENT-SMU", "源测量单元", "Source Measure Units", "SIGLENT-POWER", "SMU"],
    ["SIGLENT-SOURCE-LOAD", "源载模拟器", "Source-Load Simulators", "SIGLENT-POWER", "SOURCE-LOAD"],
    ["SIGLENT-LOAD", "电子负载", "Electronic Loads", null, "LOAD"],
    ["SIGLENT-MULTIMETER", "数字万用表", "Digital Multimeters", null, "MULTIMETER"],
    ["SIGLENT-MODULAR", "模块化仪器", "Modular Instruments", null, "MODULAR"],
  ];

  const created: { id: string; code: string }[] = [];
  for (const [code, zh, en, parentCode, siteCode] of TREE) {
    const siteCatId = siteByCode.get(siteCode);
    if (!siteCatId) {
      console.log("跳过（无全站品类）:", code, siteCode);
      continue;
    }
    const parentId = parentCode ? created.find((c) => c.code === parentCode)?.id : null;
    if (parentCode && !parentId) {
      console.log("跳过（无父分类）:", code, parentCode);
      continue;
    }
    const cat = await prisma.category.upsert({
      where: { code },
      update: { brandId: BRAND_ID, siteCategoryId: siteCatId, parentId: parentId ?? null, sortOrder: 0 },
      create: {
        code,
        brandId: BRAND_ID,
        siteCategoryId: siteCatId,
        parentId: parentId ?? null,
        sortOrder: 0,
        translations: {
          create: [
            { locale: "zh", name: zh },
            { locale: "en", name: en },
            { locale: "ru", name: zh },
          ],
        },
      },
    });
    created.push({ id: cat.id, code: cat.code });
    console.log("品牌分类:", code, "→", siteCode);
  }

  console.log("共创建品牌分类:", created.length);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
