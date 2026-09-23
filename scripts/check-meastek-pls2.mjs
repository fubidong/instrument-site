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
  const productLines = await db.productLine.findMany({
    where: { brandId: brand.id },
    include: { translations: true },
  });
  console.log("Product Lines:");
  for (const pl of productLines) {
    const zhName = pl.translations.find((t) => t.locale === "zh")?.name || pl.name;
    console.log(`  ${pl.code} - ${zhName}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
