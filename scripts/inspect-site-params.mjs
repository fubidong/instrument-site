// 对比全站品类 vs 品牌分类的参数定义
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  // 全站品类（brandId = null）的参数定义
  const siteCats = await p.category.findMany({
    where: { brandId: null },
    include: { paramGroups: { include: { translations: true, paramDefs: { include: { translations: true } } }, orderBy: { sortOrder: "asc" } } },
    orderBy: { code: "asc" },
  });
  for (const c of siteCats) {
    const defs = c.paramGroups.flatMap((g) => g.paramDefs.map((d) => d.key));
    if (defs.length > 0) {
      console.log(`${c.code} (${defs.length}): ${defs.join(", ")}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
