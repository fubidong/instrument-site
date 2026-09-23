import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const brand = await db.brand.findFirst({ where: { code: { contains: "meastek" } } });
  console.log("Brand:", brand);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
