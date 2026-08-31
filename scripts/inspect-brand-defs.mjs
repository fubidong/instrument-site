// 查看品牌分类参数定义的 zh/en 名称，用于型号参数映射
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  const cats = await p.category.findMany({
    where: { brandId: { not: null } },
    include: { paramGroups: { include: { paramDefs: { include: { translations: true } } } } },
  });
  for (const c of cats) {
    const defs = c.paramGroups.flatMap((g) => g.paramDefs);
    if (!defs.length) continue;
    console.log(`\n=== ${c.code} ===`);
    for (const d of defs) {
      const t = Object.fromEntries(d.translations.map((x) => [x.locale, x.name]));
      console.log(`  ${d.key}: zh="${t["zh"]}" en="${t["en"]}" (${d.type})`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
