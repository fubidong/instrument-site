import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const line = await prisma.productLine.findFirst({ where: { code: "SDS1000X" } });
  if (!line) {
    console.error("SDS1000X line not found");
    process.exit(1);
  }
  const defs = await prisma.paramDefinition.findMany({ where: { categoryId: line.categoryId } });
  const bw = defs.find((d) => d.key === "bandwidth");
  const ch = defs.find((d) => d.key === "channels");
  if (!bw || !ch) {
    console.error("bandwidth/channels params not found");
    process.exit(1);
  }

  async function createProduct(model: string, active: boolean, bwVal: number, chVal: string) {
    return prisma.product.create({
      data: {
        productLineId: line!.id,
        brandId: line!.brandId,
        categoryId: line!.categoryId,
        model,
        sortOrder: 0,
        isActive: active,
        isFeatured: false,
        translations: {
          create: [
            { locale: "zh", name: `${model} 数字示波器`, summary: "测试" },
            { locale: "en", name: `${model} Digital Oscilloscope`, summary: "test" },
          ],
        },
        paramValues: {
          create: [
            ...(bw ? [{ paramDefinitionId: bw.id, valueNumber: bwVal }] : []),
            ...(ch ? [{ paramDefinitionId: ch.id, valueString: chVal }] : []),
          ],
        },
      },
    });
  }

  await createProduct("SDS1104X-E", true, 100, "4");
  await createProduct("SDS1104X-E-copy", false, 100, "4");
  console.log("recreated 2 products (1 active, 1 inactive)");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
