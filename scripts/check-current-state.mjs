// 检查当前 ProductLine / Product 数据状态
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

async function main() {
  const lines = await p.productLine.findMany({ include: { _count: { select: { products: true } } } });
  console.log("ProductLine 总数:", lines.length);
  console.log("挂全站品类(非品牌分类)的系列:", lines.filter((l) => !l.categoryId.startsWith("SIGLENT")).length);
  // 显示 categoryId 是品牌分类还是全站（用 code 判断不准确，直接查 category code）
  for (const l of lines.slice(0, 5)) {
    const cat = await p.category.findUnique({ where: { id: l.categoryId }, select: { code: true } });
    console.log(`  ${l.code} -> cat ${cat?.code} (products: ${l._count.products})`);
  }
  const prods = await p.product.findMany({ include: { translations: true }, take: 5 });
  console.log("\nProduct 样例:");
  for (const pr of prods) {
    console.log(`  ${pr.model} | line: ${pr.productLineId.slice(0, 8)} | cat: ${pr.categoryId.slice(0, 8)} | cover: ${pr.coverImage?.slice(0, 40)}`);
  }
  const total = await p.product.count();
  console.log("\nProduct 总数:", total);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
