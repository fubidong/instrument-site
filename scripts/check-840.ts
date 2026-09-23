import { db } from "../src/lib/db";

async function main() {
  const tr = await db.productTranslation.findFirst({
    where: { product: { model: "FOTRIC 840系列" }, locale: "zh" },
  });
  console.log("=== desc length:", tr?.description?.length);
  console.log("=== desc first 800:");
  console.log(tr?.description?.substring(0, 800));
  console.log("=== specs length:", tr?.specsOverview?.length);
  console.log("=== specs first 800:");
  console.log(tr?.specsOverview?.substring(0, 800));
  process.exit(0);
}
main();
