// 查看重复 SVA1000X 详情
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });
async function main() {
  const lines = await p.productLine.findMany({
    where: { brandId: "2235b359-3d5c-4dcc-b763-3ea81273fd22", code: "SVA1000X" },
    include: { category: true, _count: { select: { products: true } } },
  });
  for (const l of lines) {
    console.log("line:", l.id);
    console.log("  cat:", l.category.code, l.categoryId);
    console.log("  products:", l._count.products);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
