// 验证品牌分类树 + 参数模板
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const brandCats = await prisma.category.findMany({
    where: { brandId: { not: null } },
    include: { translations: true, siteCategory: { include: { translations: true } }, paramGroups: { include: { paramDefs: true } } },
    orderBy: { sortOrder: "asc" },
  });
  console.log("品牌分类数:", brandCats.length);
  for (const c of brandCats) {
    const zh = c.translations.find((t) => t.locale === "zh")?.name;
    const siteCode = c.siteCategory?.code;
    const defs = c.paramGroups.reduce((s, g) => s + g.paramDefs.length, 0);
    console.log(`${c.code} | ${zh} | →${siteCode} | 参数:${defs}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
