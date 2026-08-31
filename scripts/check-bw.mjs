const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const pv = await db.productParamValue.findMany({
    where: { valueString: { contains: "MHz" } },
    select: { valueString: true },
    distinct: ["valueString"],
    take: 40,
  });
  console.log("MHz values:", pv.map((r) => r.valueString).join(" | "));
  await db.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
