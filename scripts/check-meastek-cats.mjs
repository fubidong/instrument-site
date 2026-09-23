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
    include: { translations: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("Categories:");
  for (const c of categories) {
    const name = c.translations.find((t) => t.locale === "zh")?.name || c.code;
    console.log(`  ${c.code} - ${name} - parent: ${c.parentId || "none"} - showInNav: ${c.showInNav}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
