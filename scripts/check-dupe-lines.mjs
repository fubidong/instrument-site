// 检查 ProductLine 重复 code
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });
async function main() {
  const lines = await p.productLine.findMany({ where: { brandId: "2235b359-3d5c-4dcc-b763-3ea81273fd22" }, select: { code: true, categoryId: true } });
  const seen = new Map();
  for (const l of lines) {
    if (!seen.has(l.code)) seen.set(l.code, []);
    seen.get(l.code).push(l.categoryId.slice(0, 8));
  }
  for (const [code, cats] of seen) {
    if (cats.length > 1) console.log(`重复 code ${code}: cats=${cats.join(", ")}`);
  }
  console.log("总系列:", lines.length, "唯一 code:", seen.size);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
