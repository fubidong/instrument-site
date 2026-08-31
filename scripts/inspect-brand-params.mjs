// 查看品牌分类参数模板
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  const brandCats = await p.category.findMany({
    where: { brandId: { not: null } },
    include: { translations: true, paramGroups: { include: { translations: true, paramDefs: { include: { translations: true } } }, orderBy: { sortOrder: "asc" } } },
    orderBy: { code: "asc" },
  });
  for (const c of brandCats) {
    const t = c.translations.map((x) => `${x.locale}:${x.name}`).join("|");
    const defs = c.paramGroups.flatMap((g) => g.paramDefs.map((d) => d.key));
    console.log(`\n${c.code} | ${t}`);
    console.log(`  groups: ${c.paramGroups.map((g) => g.code).join(", ")}`);
    console.log(`  defs(${defs.length}): ${defs.join(", ")}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
