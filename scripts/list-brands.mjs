// 列出启用品牌
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });
const brands = await p.brand.findMany({ where: { isActive: true }, select: { code: true, id: true, translations: true } });
console.log(JSON.stringify(brands, null, 1));
await p.$disconnect();
