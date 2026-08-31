// 查看全站 DC-POWER 和 POWER 的参数组结构
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  for (const code of ["DC-POWER", "POWER"]) {
    const cat = await p.category.findUnique({ where: { code }, include: { paramGroups: { include: { translations: true, paramDefs: { include: { translations: true } } }, orderBy: { sortOrder: "asc" } } } });
    console.log(`\n=== ${code} ===`);
    for (const g of cat?.paramGroups ?? []) {
      const defs = g.paramDefs.map((d) => `${d.key}(${d.type})`).join(", ");
      console.log(`  group ${g.code}: ${defs}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
