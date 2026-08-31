// 全量重建鼎阳数据：系列(ProductLine) + 型号(Product) + 参数
// 1) 删除所有鼎阳 ProductLine（级联删 Product/参数/翻译）
// 2) 从 siglent-products.json 重建 75 系列（挂品牌分类）
// 3) 从 model-details.json 导入 228 型号（挂最具体品牌分类 + 结构化参数 + specsOverview）
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BRAND_ID = "2235b359-3d5c-4dcc-b763-3ea81273fd22"; // SIGLENT

// line(主类) → 顶层品牌分类 code
const LINE_BRAND_CAT: Record<string, string> = {
  OSCILLOSCOPE: "SIGLENT-OSCILLOSCOPE",
  FUNCTION_GEN: "SIGLENT-FUNCTION-GEN",
  SPECTRUM: "SIGLENT-SPECTRUM",
  VNA: "SIGLENT-VNA",
  RF_GEN: "SIGLENT-RF-GEN",
  POWER: "SIGLENT-POWER",
  LOAD: "SIGLENT-LOAD",
  MULTIMETER: "SIGLENT-MULTIMETER",
  MODULAR: "SIGLENT-MODULAR",
};

// 官网分类名(子类) → 品牌子分类 code
const CAT_NAME_MAP: Record<string, string> = {
  高分辨率示波器: "SIGLENT-HI-RES-OSC",
  数字示波器: "SIGLENT-DIGITAL-OSC",
  手持示波表: "SIGLENT-HANDHELD-OSC",
  紧凑型示波器: "SIGLENT-COMPACT-OSC",
  线性电源: "SIGLENT-LINEAR-POWER",
  开关电源: "SIGLENT-SWITCH-POWER",
  源测量单元: "SIGLENT-SMU",
  源载模拟器: "SIGLENT-SOURCE-LOAD",
};

// 品牌子分类 → 顶层参数分类 code（子类继承顶层参数）
const SUB_TO_TOP: Record<string, string> = {
  "SIGLENT-HI-RES-OSC": "SIGLENT-OSCILLOSCOPE",
  "SIGLENT-DIGITAL-OSC": "SIGLENT-OSCILLOSCOPE",
  "SIGLENT-HANDHELD-OSC": "SIGLENT-OSCILLOSCOPE",
  "SIGLENT-COMPACT-OSC": "SIGLENT-OSCILLOSCOPE",
  "SIGLENT-LINEAR-POWER": "SIGLENT-POWER",
  "SIGLENT-SWITCH-POWER": "SIGLENT-POWER",
  "SIGLENT-SMU": "SIGLENT-POWER",
  "SIGLENT-SOURCE-LOAD": "SIGLENT-POWER",
};

// 子分类 → 参数映射主类（ATTR_MAP 的 key）
const SUB_MAIN: Record<string, string> = {
  "SIGLENT-HI-RES-OSC": "OSCILLOSCOPE",
  "SIGLENT-DIGITAL-OSC": "OSCILLOSCOPE",
  "SIGLENT-HANDHELD-OSC": "OSCILLOSCOPE",
  "SIGLENT-COMPACT-OSC": "OSCILLOSCOPE",
  "SIGLENT-LINEAR-POWER": "POWER",
  "SIGLENT-SWITCH-POWER": "POWER",
  "SIGLENT-SMU": "POWER",
  "SIGLENT-SOURCE-LOAD": "POWER",
};

// 中文参数名 → key（按主类）
const ATTR_MAP: Record<string, Record<string, string>> = {
  OSCILLOSCOPE: {
    带宽: "bandwidth",
    模拟带宽: "bandwidth",
    通道数: "channels",
    实时采样率: "sampleRate",
    最高实时采样率: "sampleRate",
    实时采样率高达: "sampleRate",
    垂直分辨率: "verticalResolution",
    存储深度: "storageDepth",
    最大存储深度: "storageDepth",
    波形捕获率: "waveformRate",
    波形刷新率: "waveformRate",
    最高波形捕获率: "waveformRate",
  },
  FUNCTION_GEN: {
    通道数: "channels",
    最高采样率: "sampleRate",
    最高输出频率: "maxFreq",
    输出频率范围: "maxFreq",
    垂直分辨率: "verticalResolution",
    任意波长度: "arbLength",
  },
  SPECTRUM: {
    频率范围: "freqRange",
    频谱分析频率范围: "freqRange",
    最大实时带宽: "realTimeBW",
    相位噪声: "phaseNoise",
    "相位噪声(典型值)": "phaseNoise",
    "显示平均噪声电平（DANL）": "danl",
    "显示平均噪声电平(DANL)": "danl",
    分辨率带宽: "rbw",
  },
  VNA: {
    频率范围: "freqRange",
    测量频率范围: "freqRange",
    端口数: "ports",
    动态范围: "dynamicRange",
    输出功率设置范围: "outputPower",
  },
  RF_GEN: {
    频率范围: "freqRange",
    输出频率范围: "freqRange",
    最大输出功率: "maxOutputPower",
    额定输出功率: "maxOutputPower",
    相位噪声: "phaseNoise",
    "相位噪声(典型值)": "phaseNoise",
    频率分辨率: "freqRes",
    幅度分辨率: "freqRes",
    IQ调制: "iqMod",
    IQ分析带宽: "iqMod",
  },
  POWER: {
    通道数: "channels",
    最大单路输出电压: "maxVoltage",
    最大单路输出电流: "maxCurrent",
    最大输出功率: "outputPower",
    额定输出功率: "outputPower",
    分辨率: "resolution",
  },
  LOAD: {
    通道数: "channels",
    电压: "voltage",
    电流: "current",
    总功率: "power",
  },
  MULTIMETER: {
    读数分辨率: "resolution",
    最大采样速率: "sampleRate",
    DCV基本精度: "dcAccuracy",
    NPLC: "nplc",
    扫描卡: "scanCard",
  },
  MODULAR: {
    通道数: "channels",
  },
};

async function main() {
  const models = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "model-details.json"), "utf8"));
  const sp = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "siglent-products.json"), "utf8"));
  console.log("型号:", models.length, "系列数据:", sp.length);

  // 1. 品牌分类 code → id
  const brandCats = await prisma.category.findMany({ where: { brandId: BRAND_ID } });
  const brandCatByCode = Object.fromEntries(brandCats.map((c) => [c.code, c.id]));

  // 2. 删除所有鼎阳 ProductLine（级联删 Product/参数）
  const oldLines = await prisma.productLine.findMany({ where: { brandId: BRAND_ID } });
  for (const l of oldLines) {
    await prisma.productLine.delete({ where: { id: l.id } });
  }
  console.log("删除旧系列:", oldLines.length);

  // 3. 重建系列 ProductLine（从 siglent-products）
  //    系列归属：最具体品牌分类（子类优先）
  const lineByCode = new Map<string, string>(); // code -> line.id
  let lineOk = 0;
  let lineSkip = 0;
  for (const p of sp) {
    const subCatCode = (p.cats || []).map((c: string) => CAT_NAME_MAP[c]).find(Boolean);
    const brandCatCode = subCatCode || LINE_BRAND_CAT[p.line];
    const brandCatId = brandCatCode ? brandCatByCode[brandCatCode] : null;
    if (!brandCatId) {
      console.log("SKIP 系列无分类:", p.name, p.line, p.cats);
      lineSkip++;
      continue;
    }
    const line = await prisma.productLine.create({
      data: {
        brandId: BRAND_ID,
        categoryId: brandCatId,
        code: p.name,
        translations: {
          create: [
            { locale: "zh", name: p.name, description: p.excerpt || null },
            { locale: "en", name: p.name, description: p.excerpt || null },
          ],
        },
      },
    });
    lineByCode.set(p.name, line.id);
    lineOk++;
  }
  console.log("重建系列:", lineOk, "跳过:", lineSkip);

  // 4. 导入型号
  let ok = 0;
  let skipped = 0;
  let paramCount = 0;
  for (const m of models) {
    const lineId = lineByCode.get(m.series);
    if (!lineId) {
      console.log("SKIP 型号无系列:", m.model, m.series);
      skipped++;
      continue;
    }
    // 型号归属品牌分类：用 siglent-products 的 cats 定位子分类
    const spItem = sp.find((x: any) => x.name === m.series);
    const subCatCode = (spItem?.cats || []).map((c: string) => CAT_NAME_MAP[c]).find(Boolean);
    const brandCatCode = subCatCode || LINE_BRAND_CAT[m.line];
    const brandCatId = brandCatCode ? brandCatByCode[brandCatCode] : null;
    if (!brandCatId) {
      console.log("SKIP 型号无品牌分类:", m.model, m.line);
      skipped++;
      continue;
    }
    // 参数定义分类 = 顶层品牌分类
    const topBrandCatCode = SUB_TO_TOP[brandCatCode] || brandCatCode;
    const topBrandCatId = brandCatByCode[topBrandCatCode];
    const main = SUB_MAIN[brandCatCode] || m.line;

    const specRows = m.params.map((p: any) => `${p.name}：${p.value}`).join("\n");
    const coverImage = m.imagePath || null;

    const product = await prisma.product.create({
      data: {
        productLineId: lineId,
        brandId: BRAND_ID,
        categoryId: brandCatId,
        model: m.model,
        coverImage,
        translations: {
          create: [
            { locale: "zh", name: m.model, summary: m.title || null, specsOverview: specRows || null },
            { locale: "en", name: m.model, summary: m.title || null, specsOverview: specRows || null },
          ],
        },
      },
    });

    // 结构化参数
    const attrMap = ATTR_MAP[main] || {};
    for (const attr of m.params) {
      const key = attrMap[attr.name];
      if (!key) continue;
      const def = await prisma.paramDefinition.findUnique({
        where: { categoryId_key: { categoryId: topBrandCatId, key } },
      });
      if (!def) continue;
      const value = String(attr.value).trim();
      const isBoolean = def.type === "boolean";
      await prisma.productParamValue.create({
        data: {
          productId: product.id,
          paramDefinitionId: def.id,
          valueString: isBoolean ? null : value,
          valueBoolean: isBoolean ? (value.includes("支持") || value.includes("标配") || value === "有" || value.toLowerCase().includes("yes") ? true : null) : null,
        },
      });
      paramCount++;
    }

    // 素材库登记
    if (coverImage) {
      const absPath = path.join(process.cwd(), "public", coverImage);
      const size = fs.existsSync(absPath) ? fs.statSync(absPath).size : null;
      const filename = coverImage.split("/").pop() || "";
      await prisma.mediaAsset.upsert({
        where: { path: coverImage },
        create: { filename, path: coverImage, mimeType: "image/jpeg", kind: "image", size, category: "product" },
        update: {},
      });
    }

    ok++;
    if (ok % 40 === 0) console.log(`...${ok}/${models.length}`);
  }

  console.log("\n完成 系列:", lineOk, "型号:", ok, "跳过:", skipped, "参数值:", paramCount);
  const total = await prisma.product.count({ where: { brandId: BRAND_ID } });
  const pv = await prisma.productParamValue.count({ where: { product: { brandId: BRAND_ID } } });
  console.log("DB 鼎阳型号:", total, "参数值:", pv);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
