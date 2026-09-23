import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import SupportArticleForm, { type SupportArticleFormData } from "../../support-article-form";

function toLocalInputValue(d: Date | null): string {
  if (!d) return "";
  const dd = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dd.getFullYear()}-${pad(dd.getMonth() + 1)}-${pad(dd.getDate())}T${pad(dd.getHours())}:${pad(dd.getMinutes())}`;
}

/** 素材库中的 PDF（kind=doc 且 mimeType=pdf，或 path 以 .pdf 结尾） */
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

/** 活跃商品（型号 + 品牌名），供 datalist 搜索 */
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

export default async function EditSupportArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, brands, pdfAssets, products] = await Promise.all([
    db.supportArticle.findUnique({
      where: { id },
      include: {
        translations: true,
        pdfLinks: { include: { pdfAsset: { select: { filename: true } } } },
        productLinks: { include: { product: { select: { model: true } } } },
      },
    }),
    db.brand.findMany({
      where: { isActive: true },
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    getPdfAssets(),
    getProducts(),
  ]);
  if (!article) notFound();

  const zh = article.translations.find((tr) => tr.locale === "zh");
  const en = article.translations.find((tr) => tr.locale === "en");

  const formData: SupportArticleFormData = {
    id: article.id,
    type: article.type,
    brandId: article.brandId,
    coverImage: article.coverImage,
    sourceUrl: article.sourceUrl,
    pdfLinks: article.pdfLinks.map((l) => ({ pdfAssetId: l.pdfAssetId, pdfMode: l.pdfMode })),
    productLinks: article.productLinks.map((l) => ({ model: l.product.model })),
    isPublished: article.isPublished,
    publishedAt: toLocalInputValue(article.publishedAt),
    sortOrder: article.sortOrder,
    zhTitle: zh?.title ?? "",
    zhSummary: zh?.summary ?? "",
    zhContent: zh?.content ?? "",
    enTitle: en?.title ?? "",
    enSummary: en?.summary ?? "",
    enContent: en?.content ?? "",
  };

  const brandOptions = brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return { id: b.id, zhName: t["zh"]?.name ?? b.code, enName: t["en"]?.name ?? "" };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">编辑支持中心文章</h1>
        <Link href="/admin/support-articles" className="text-sm text-sky-600 hover:underline">
          ← 返回列表
        </Link>
      </div>
      <SupportArticleForm article={formData} brands={brandOptions} pdfAssets={pdfAssets} products={products} />
    </div>
  );
}
