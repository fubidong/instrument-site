// 查看当前参数模板结构
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const groups = await prisma.paramGroup.findMany({
    include: { translations: true, paramDefs: { include: { translations: true } } },
  });
  for (const g of groups) {
    const cat = await prisma.category.findUnique({ where: { id: g.categoryId }, include: { translations: true } });
    console.log(`\nGROUP: ${g.code} (cat: ${cat?.code || g.categoryId}) ${g.translations.map((t) => `${t.locale}:${t.name}`).join("/")}`);
    for (const d of g.paramDefs) {
      console.log(`  DEF: ${d.key} [${d.type}] filter=${d.isFilterable} cmp=${d.isComparable} ${d.translations.map((t) => `${t.locale}:${t.name}`).join("/")}`);
    }
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
