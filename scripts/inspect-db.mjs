import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

const cats = await p.category.findMany({ include: { translations: true } });
console.log("=== CATEGORIES ===");
for (const c of cats) {
  const t = c.translations.map((x) => `${x.locale}:${x.name}`).join(" | ");
  console.log(c.code, "| parent:", c.parentId ? c.parentId.slice(0, 8) : "-", "|", t);
}

const lines = await p.productLine.findMany({ include: { translations: true } });
console.log("\n=== PRODUCT LINES:", lines.length, "===");
lines.slice(0, 30).forEach((l) => console.log(l.code, "| cat:", l.categoryId.slice(0, 8)));

const prods = await p.product.count();
const params = await p.paramDefinition.count();
const pvs = await p.productParamValue.count();
console.log("\nproducts:", prods, "paramDefs:", params, "paramValues:", pvs);

await p.$disconnect();
