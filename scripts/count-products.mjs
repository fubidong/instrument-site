// 检查产品数
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });
async function main() {
  console.log("products:", await p.product.count());
  console.log("paramValues:", await p.productParamValue.count());
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
