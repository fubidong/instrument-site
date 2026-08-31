// 导入鼎阳 75 个主仪器系列：ProductLine + Product + 参数值 + 下载图片到素材库
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BRAND_ID = "2235b359-3d5c-4dcc-b763-3ea81273fd22";
const CAT_IDS: Record<string, string> = {
  OSCILLOSCOPE: "6e48b858-3a18-4bd3-a645-70ad3067e568",
  "HI-RES-OSC": "cca07a57-3511-4bfc-80c8-137b3ff7b2ff",
  "DIGITAL-OSC": "7a17774d-9209-4483-bac7-7ecb35bb044e",
  "HANDHELD-OSC": "62554440-56cd-41cd-9d3e-d558cc1b42e4",
  "COMPACT-OSC": "97f4d6dc-a8b6-4c63-aec6-a2a1ff38a3b5",
  FUNCTION_GEN: "af514cd5-a565-430a-b355-2b866af1304e",
  SPECTRUM: "9752182d-e6aa-400a-bfc1-3d96f8e1401b",
  VNA: "d296ccd6-4ced-4e5e-a82f-9e607cff1d73",
  RF_GEN: "5164800a-5509-4220-9bf0-6c93df4c491e",
  POWER: "5d05c27d-d71f-4d48-912e-4250d25d7d78",
  "LINEAR-POWER": "9d3b4e41-07eb-4e98-9a14-5adb1f4bd1c0",
  "SWITCH-POWER": "be833f55-e031-42d4-ba7b-c60eac4355eb",
  SMU: "9e87e379-41b9-4aa2-8e62-d607f4c67f64",
  "SOURCE-LOAD": "195a1312-8ab4-40d2-a305-d16e31aa9f30",
  LOAD: "77e1ce13-33f7-4c9c-b060-7bda5702a6b9",
  MULTIMETER: "20b89936-f1ab-416d-b5bc-448b9a5c9fce",
  MODULAR: "8a3977d2-9de1-401a-9c3d-0f44378f9b5e",
};

// 官网分类名 → 系统子类 code
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
// 产品线 → 主类 code
const LINE_MAIN: Record<string, string> = {
  OSCILLOSCOPE: "OSCILLOSCOPE",
  FUNCTION_GEN: "FUNCTION_GEN",
  SPECTRUM: "SPECTRUM",
  VNA: "VNA",
  RF_GEN: "RF_GEN",
  POWER: "POWER",
  LOAD: "LOAD",
  MULTIMETER: "MULTIMETER",
  MODULAR: "MODULAR",
};

// 参数映射：attr name(中文) → 系统 key；按产品线
const ATTR_MAP: Record<string, Record<string, string>> = {
  OSCILLOSCOPE: {
    模拟带宽: "bandwidth",
    通道数: "channels",
    最高实时采样率: "sampleRate",
    垂直分辨率: "verticalResolution",
    最大存储深度: "storageDepth",
    最高波形捕获率: "waveformRate",
  },
  FUNCTION_GEN: {
    最高输出频率: "maxFreq",
    最高采样率: "sampleRate",
    垂直分辨率: "verticalResolution",
    任意波长度: "arbLength",
    通道数: "channels",
  },
  SPECTRUM: {
    频率范围: "freqRange",
    最大实时带宽: "realTimeBW",
    相位噪声: "phaseNoise",
    显示平均噪声电平: "danl",
    分辨率带宽: "rbw",
  },
  VNA: {
    测量频率范围: "freqRange",
    端口数: "ports",
    动态范围: "dynamicRange",
    输出功率设置范围: "outputPower",
  },
  RF_GEN: {
    频率范围: "freqRange",
    最大输出功率: "maxOutputPower",
    相位噪声: "phaseNoise",
    IQ调制: "iqMod",
    频率分辨率: "freqRes",
  },
  POWER: {
    最大单路输出电压: "maxVoltage",
    最大单路输出电流: "maxCurrent",
    最大输出功率: "outputPower",
    通道数: "channels",
    分辨率: "resolution",
  },
  LOAD: {
    电压: "voltage",
    电流: "current",
    总功率: "power",
    通道数: "channels",
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

function download(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (fs.existsSync(dest)) return resolve(true);
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(false);
        }
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on("finish", () => {
          ws.close();
          resolve(true);
        });
        ws.on("error", () => resolve(false));
      })
      .on("error", () => resolve(false));
  });
}

async function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "siglent-products.json"), "utf8"));
  console.log("总系列:", data.length);

  // 清理旧导入（级联删除 products/paramValues/translations）
  const oldLines = await prisma.productLine.findMany({ where: { brandId: BRAND_ID } });
  for (const l of oldLines) {
    await prisma.productLine.delete({ where: { id: l.id } });
  }
  console.log("已清理旧系列:", oldLines.length);

  let ok = 0;
  let skipped = 0;
  for (const p of data) {
    // 1. 确定类别
    const subCode = (p.cats || []).map((c: string) => CAT_NAME_MAP[c]).find(Boolean);
    const categoryCode = subCode || LINE_MAIN[p.line];
    const categoryId = CAT_IDS[categoryCode];
    if (!categoryId) {
      console.log("SKIP no cat", p.name, p.line, p.cats);
      skipped++;
      continue;
    }

    // 2. ProductLine（系列）
    const lineCode = p.name;
    const line = await prisma.productLine.upsert({
      where: { brandId_categoryId_code: { brandId: BRAND_ID, categoryId, code: lineCode } },
      create: {
        brandId: BRAND_ID,
        categoryId,
        code: lineCode,
        translations: {
          create: [
            { locale: "zh", name: p.name, description: p.excerpt || null },
            { locale: "en", name: p.name, description: p.excerpt || null },
          ],
        },
      },
      update: {},
    });

    // 3. 下载图片
    let coverImage: string | null = null;
    if (p.image) {
      const ext = path.extname(new URL(p.image).pathname) || ".png";
      const fileName = `${p.name}${ext}`;
      const relDir = `/uploads/product/${new Date().getFullYear()}`;
      const absDir = path.join(process.cwd(), "public", relDir);
      if (!fs.existsSync(absDir)) fs.mkdirSync(absDir, { recursive: true });
      const absPath = path.join(absDir, fileName);
      const dl = await download(p.image, absPath);
      if (dl) {
        coverImage = `${relDir}/${fileName}`;
        // 写入素材库
        const size = fs.existsSync(absPath) ? fs.statSync(absPath).size : null;
        await prisma.mediaAsset.upsert({
          where: { path: coverImage },
          create: {
            filename: fileName,
            path: coverImage,
            mimeType: "image/png",
            kind: "image",
            size,
            category: "product",
          },
          update: {},
        });
      }
    }

    // 4. Product
    const product = await prisma.product.upsert({
      where: { model: lineCode },
      create: {
        productLineId: line.id,
        brandId: BRAND_ID,
        categoryId,
        model: lineCode,
        coverImage,
        translations: {
          create: [
            {
              locale: "zh",
              name: p.name,
              summary: p.excerpt || null,
              specsOverview: p.models.length ? `可选型号：${p.models.join("、")}` : null,
            },
            {
              locale: "en",
              name: p.name,
              summary: p.excerpt || null,
              specsOverview: p.models.length ? `Models: ${p.models.join(", ")}` : null,
            },
          ],
        },
      },
      update: { coverImage: coverImage || undefined, categoryId },
    });

    // 5. 参数值 —— 参数模板挂主类，用主类找定义
    const mainCatCode = LINE_MAIN[p.line];
    const mainCategoryId = CAT_IDS[mainCatCode];
    const attrMap = ATTR_MAP[p.line] || {};
    for (const attr of p.attrs) {
      const key = attrMap[attr.name];
      if (!key) continue;
      const def = await prisma.paramDefinition.findUnique({
        where: { categoryId_key: { categoryId: mainCategoryId, key } },
      });
      if (!def) continue;
      const value = attr.values.join(" | ");
      const isBoolean = def.type === "boolean";
      await prisma.productParamValue.upsert({
        where: { productId_paramDefinitionId: { productId: product.id, paramDefinitionId: def.id } },
        create: {
          productId: product.id,
          paramDefinitionId: def.id,
          valueString: isBoolean ? null : value,
          valueBoolean: isBoolean ? (value.toLowerCase() === "支持" || value.toLowerCase() === "标配" || value === "有" ? true : null) : null,
        },
        update: {
          valueString: isBoolean ? null : value,
          valueBoolean: isBoolean ? (value.toLowerCase() === "支持" || value.toLowerCase() === "标配" || value === "有" ? true : null) : null,
        },
      });
    }

    ok++;
    if (ok % 10 === 0) console.log(`...${ok}/${data.length}`);
  }

  console.log("完成 成功:", ok, "跳过:", skipped);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
