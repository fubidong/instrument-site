// 检查品牌分类 siteCategory 映射
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  const brandCats = await p.category.findMany({ where: { brandId: { not: null } }, select: { code: true, siteCategoryId: true } });
  for (const c of brandCats) {
    const sc = c.siteCategoryId ? await p.category.findUnique({ where: { id: c.siteCategoryId }, select: { code: true } }) : null;
    console.log(c.code, "->", sc?.code ?? "NULL");
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
