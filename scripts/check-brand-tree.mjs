// 查看品牌分类树（含父子关系）
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  const cats = await p.category.findMany({
    where: { brandId: "2235b359-3d5c-4dcc-b763-3ea81273fd22" },
    include: { translations: true },
  });
  const byId = new Map(cats.map((c) => [c.id, c]));
  for (const c of cats) {
    const parent = c.parentId ? byId.get(c.parentId) : null;
    const t = c.translations.find((x) => x.locale === "zh")?.name || c.code;
    console.log(`${c.code} | parent: ${parent?.code ?? "-"} | zh:${t} | siteCat:${c.siteCategoryId?.slice(0, 8) ?? "-"}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
