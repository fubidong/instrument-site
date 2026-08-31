// 修复：重建品牌 SIGLENT-POWER 参数模板（合并全站 POWER + DC-POWER）
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 目标品牌分类 code → 要合并的全站品类 code 列表
const FIX = {
  "SIGLENT-POWER": ["POWER", "DC-POWER"],
};

async function main() {
  for (const [brandCode, siteCodes] of Object.entries(FIX)) {
    const brandCat = await prisma.category.findUnique({ where: { code: brandCode } });
    if (!brandCat) { console.log("无品牌分类", brandCode); continue; }

    // 1. 删除品牌分类现有参数组（级联删 defs/翻译/values）
    const oldGroups = await prisma.paramGroup.findMany({ where: { categoryId: brandCat.id } });
    for (const g of oldGroups) {
      await prisma.paramGroup.delete({ where: { id: g.id } });
    }
    console.log(`删除 ${brandCode} 旧参数组: ${oldGroups.length}`);

    // 2. 合并复制全站品类的参数模板
    let copied = 0;
    for (const siteCode of siteCodes) {
      const siteCat = await prisma.category.findUnique({ where: { code: siteCode } });
      if (!siteCat) { console.log("无全站品类", siteCode); continue; }
      const groups = await prisma.paramGroup.findMany({
        where: { categoryId: siteCat.id },
        include: { translations: true, paramDefs: { include: { translations: true } } },
        orderBy: { sortOrder: "asc" },
      });
      for (const g of groups) {
        if (g.paramDefs.length === 0) continue; // 跳过空组
        // 若已有同名 group，追加 defs
        const existingGroup = await prisma.paramGroup.findUnique({
          where: { categoryId_code: { categoryId: brandCat.id, code: g.code } },
          include: { paramDefs: true },
        });
        if (existingGroup) {
          const existingKeys = new Set(existingGroup.paramDefs.map((d) => d.key));
          for (const d of g.paramDefs) {
            if (existingKeys.has(d.key)) continue;
            await prisma.paramDefinition.create({
              data: {
                categoryId: brandCat.id,
                paramGroupId: existingGroup.id,
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
                translations: { create: d.translations.map((t) => ({ locale: t.locale, name: t.name, unit: t.unit ?? undefined, description: t.description ?? undefined })) },
              },
            });
            copied++;
          }
          console.log(`合并到 ${brandCode}/${g.code}: +${g.paramDefs.filter((d) => !existingKeys.has(d.key)).length}`);
        } else {
          await prisma.paramGroup.create({
            data: {
              categoryId: brandCat.id,
              code: g.code,
              sortOrder: g.sortOrder,
              translations: { create: g.translations.map((t) => ({ locale: t.locale, name: t.name })) },
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
                  translations: { create: d.translations.map((t) => ({ locale: t.locale, name: t.name, unit: t.unit ?? undefined, description: t.description ?? undefined })) },
                })),
              },
            },
          });
          copied += g.paramDefs.length;
          console.log(`新建 ${brandCode}/${g.code}: ${g.paramDefs.length}定义`);
        }
      }
    }
    console.log(`→ ${brandCode} 共 ${copied} 定义`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
