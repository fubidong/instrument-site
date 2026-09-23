import { db } from "../src/lib/db";

async function main() {
  const tr = await db.productTranslation.findFirst({
    where: { product: { model: "FOTRIC 840系列" }, locale: "zh" },
  });
  const s = (tr?.specsOverview || "").trim();
  console.log("starts with <:", s.startsWith("<"));
  console.log("first 100 chars:", s.substring(0, 100));
  console.log("length:", s.length);
  process.exit(0);
}
main();
