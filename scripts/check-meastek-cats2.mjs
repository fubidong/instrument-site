import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const brand = await db.brand.findUnique({ where: { code: "meastek" } });
  if (!brand) {
    console.log("Brand not found");
    return;
  }
  const categories = await db.category.findMany({
    where: { brandId: brand.id },
    orderBy: { sortOrder: "asc" },
  });
  console.log("Total categories:", categories.length);
  console.log("Categories:");
  for (const c of categories) {
    console.log(`  id: ${c.id} - code: ${c.code} - parentId: ${c.parentId} - showInNav: ${c.showInNav}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
