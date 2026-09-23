import { db } from "../src/lib/db";

async function main() {
  const tr = await db.productTranslation.findFirst({
    where: { product: { model: "FOTRIC 840系列" }, locale: "zh" },
  });
  console.log("=== summary:", tr?.summary?.substring(0, 500));
  console.log("=== features:", tr?.features?.substring(0, 500));
  console.log("=== selection:", tr?.selection?.substring(0, 200));
  process.exit(0);
}
main();
