// 复制全站品类参数模板 → 鼎阳品牌分类（品牌专属参数）
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 全站品类 code → 品牌分类 code 映射（顶层品牌分类）
const MAP = {
  OSCILLOSCOPE: "SIGLENT-OSCILLOSCOPE",
  "DC-POWER": "SIGLENT-POWER",
  FUNCTION_GEN: "SIGLENT-FUNCTION-GEN",
  SPECTRUM: "SIGLENT-SPECTRUM",
  VNA: "SIGLENT-VNA",
  RF_GEN: "SIGLENT-RF-GEN",
  POWER: "SIGLENT-POWER",
  LOAD: "SIGLENT-LOAD",
  MULTIMETER: "SIGLENT-MULTIMETER",
  MODULAR: "SIGLENT-MODULAR",
};

async function main() {
  let copied = 0;
  for (const [siteCode, brandCode] of Object.entries(MAP)) {
    const siteCat = await prisma.category.findUnique({ where: { code: siteCode } });
    const brandCat = await prisma.category.findUnique({ where: { code: brandCode } });
    if (!siteCat || !brandCat) {
      console.log("跳过:", siteCode, brandCode);
      continue;
    }

    // 取全站品类的参数模板（含定义+翻译）
    const groups = await prisma.paramGroup.findMany({
      where: { categoryId: siteCat.id },
      include: { translations: true, paramDefs: { include: { translations: true } } },
    });

    for (const g of groups) {
      // 品牌分类下是否已有同名 group
      const existingGroup = await prisma.paramGroup.findUnique({
        where: { categoryId_code: { categoryId: brandCat.id, code: g.code } },
      });
      if (existingGroup) {
        console.log("已存在 group:", brandCode, g.code);
        continue;
      }
      const newGroup = await prisma.paramGroup.create({
        data: {
          categoryId: brandCat.id,
          code: g.code,
          sortOrder: g.sortOrder,
          translations: {
            create: g.translations.map((t) => ({ locale: t.locale, name: t.name })),
          },
          paramDefs: {
            create: g.paramDefs.map((d) => ({
              categoryId: brandCat.id,
              key: d.key,
              type: d.type,
              unit: d.unit ?? undefined,
              isFilterable: d.isFilterable,
              isComparable: d.isComparable,
              isRequired: d.isRequired,
              isHighlight: d.isHighlight,
              sortOrder: d.sortOrder,
              options: d.options ?? undefined,
              minValue: d.minValue ?? undefined,
              maxValue: d.maxValue ?? undefined,
              step: d.step ?? undefined,
              precision: d.precision ?? undefined,
              translations: {
                create: d.translations.map((t) => ({ locale: t.locale, name: t.name, unit: t.unit ?? undefined, description: t.description ?? undefined })),
              },
            })),
          },
        },
      });
      copied += g.paramDefs.length;
      console.log("复制参数模板:", brandCode, g.code, `(${g.paramDefs.length}定义)`);
    }
  }
  console.log("共复制参数定义:", copied);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
