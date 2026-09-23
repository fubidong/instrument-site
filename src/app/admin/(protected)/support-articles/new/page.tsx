import { db } from "@/lib/db";
import SupportArticleForm from "../support-article-form";

async function getBrandOptions() {
  const brands = await db.brand.findMany({
    where: { isActive: true },
    include: { translations: true },
    orderBy: { sortOrder: "asc" },
  });
  return brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return { id: b.id, zhName: t["zh"]?.name ?? b.code, enName: t["en"]?.name ?? "" };
  });
}

async function getPdfAssets() {
  const assets = await db.mediaAsset.findMany({
    where: {
      OR: [{ kind: "doc" }, { mimeType: { contains: "pdf" } }, { path: { endsWith: ".pdf" } }],
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  return assets.map((a) => ({ id: a.id, filename: a.filename, path: a.path }));
}

async function getProducts() {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { model: true, brand: { select: { code: true, translations: { select: { locale: true, name: true } } } } },
    orderBy: { model: "asc" },
    take: 8000,
  });
  return products.map((p) => {
    const zh = p.brand.translations.find((tr) => tr.locale === "zh")?.name ?? p.brand.code;
    return { model: p.model, brandName: zh };
  });
}

export default async function NewSupportArticlePage() {
  const [brands, pdfAssets, products] = await Promise.all([getBrandOptions(), getPdfAssets(), getProducts()]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">新增支持中心文章</h1>
      <SupportArticleForm article={null} brands={brands} pdfAssets={pdfAssets} products={products} />
    </div>
  );
}
