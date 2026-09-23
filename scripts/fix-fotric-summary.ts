import * as cheerio from "cheerio";
import { db } from "../src/lib/db";

async function main() {
  const brand = await db.brand.findUnique({ where: { code: "FOTRIC" } });
  if (!brand) throw new Error("no brand");

  const products = await db.product.findMany({
    where: { brandId: brand.id },
    include: { translations: true },
  });
  console.log("total FOTRIC products:", products.length);

  let fixed = 0;
  for (const p of products) {
    const tr = p.translations.find((t) => t.locale === "zh");
    if (!tr) continue;

    // 从 description HTML 里提取产品简介（shareContent 里的文本）
    const $ = cheerio.load("<div>" + (tr.description || "") + "</div>");
    const summaryText = $(".shareContent, .info_container .shareContent").first().text().trim();

    // 同时从产品介绍 HTML 里提取版本型号
    const variants: string[] = [];
    $("button.el-button--product span").each((_, el) => {
      const v = $(el).text().trim();
      if (v && /\d/.test(v)) variants.push(v);
    });

    // 更新 summary（如果有简介就用，没有就清空）
    await db.productTranslation.update({
      where: { id: tr.id },
      data: {
        summary: summaryText || "",
      },
    });
    fixed++;
    console.log(`✓ ${p.model} summary="${summaryText.substring(0, 50)}"`);
  }
  console.log(`done fixed=${fixed}`);
  process.exit(0);
}
main();
