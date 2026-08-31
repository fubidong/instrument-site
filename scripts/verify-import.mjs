// 验证导入的型号数据
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });
async function main() {
  // 抽查型号
  const picks = ["SDS6034 H10 PRO", "SDS804X HD", "SNA5052X", "SPS5084X", "SDM3065X"];
  for (const m of picks) {
    const pr = await p.product.findUnique({
      where: { model: m },
      include: { productLine: true, category: { include: { translations: true } }, paramValues: { include: { paramDefinition: true } }, translations: true },
    });
    if (!pr) { console.log(m, "NOT FOUND"); continue; }
    const catZh = pr.category.translations.find((t) => t.locale === "zh")?.name;
    console.log(`\n${m}`);
    console.log(`  系列: ${pr.productLine.code} | 分类: ${catZh} (${pr.category.code})`);
    console.log(`  图: ${pr.coverImage?.slice(0, 50) ?? "无"}`);
    const pvs = pr.paramValues.map((v) => `${v.paramDefinition.key}=${v.valueString ?? v.valueBoolean ?? "?"}`);
    console.log(`  参数(${pvs.length}): ${pvs.join(" | ")}`);
    console.log(`  规格表: ${pr.translations[0]?.specsOverview?.slice(0, 60)}...`);
  }

  // 分类分布
  const byCat = await p.product.groupBy({ by: ["categoryId"], _count: true, where: { brandId: "2235b359-3d5c-4dcc-b763-3ea81273fd22" } });
  const cats = await p.category.findMany({ where: { id: { in: byCat.map((x) => x.categoryId) } }, include: { translations: true } });
  console.log("\n=== 分类分布 ===");
  for (const c of cats) {
    const cnt = byCat.find((x) => x.categoryId === c.id)?._count ?? 0;
    const zh = c.translations.find((t) => t.locale === "zh")?.name;
    console.log(`  ${zh} (${c.code}): ${cnt} 型号`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
