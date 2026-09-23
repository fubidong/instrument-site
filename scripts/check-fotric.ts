import { db } from "../src/lib/db";

async function main() {
  const brand = await db.brand.findUnique({ where: { code: "FOTRIC" } });
  if (!brand) { console.log("no FOTRIC brand"); process.exit(0); }
  console.log("brand:", brand.id);
  const prods = await db.product.findMany({
    where: { brandId: brand.id },
    select: { model: true, coverImage: true, translations: true },
  });
  console.log("total:", prods.length);
  let noImg = 0, noDesc = 0, noSpec = 0;
  for (const p of prods) {
    const t = (p.translations || []).find((x: any) => x.locale === "zh");
    if (!p.coverImage) noImg++;
    if (!t?.description || t.description.length < 100) noDesc++;
    if (!t?.specsOverview || t.specsOverview.length < 100) noSpec++;
  }
  console.log("noImage:", noImg, "noDesc:", noDesc, "noSpec:", noSpec);
  for (const p of prods.slice(0, 3)) {
    const t = (p.translations || []).find((x: any) => x.locale === "zh");
    console.log("---", p.model, "img:", p.coverImage?.slice(0, 50), "descLen:", t?.description?.length, "specsLen:", t?.specsOverview?.length);
    console.log("  desc head:", t?.description?.slice(0, 200));
  }
  process.exit(0);
}
main();
