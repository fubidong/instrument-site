import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import { routing } from "@/i18n/routing";
import BrandFilterExplorer from "../brand-filter";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const brand =
    (await db.brand.findUnique({ where: { code }, include: { translations: true } })) ??
    (await db.brand.findMany({ include: { translations: true } })).find(
      (b) => b.code.toLowerCase() === code.toLowerCase()
    ) ??
    null;
  if (!brand || !brand.isActive) notFound();

  const bt = Object.fromEntries(brand.translations.map((tr) => [tr.locale, tr]));
  const brandName = bt[locale]?.name ?? bt["zh"]?.name ?? brand.code;

  // 品牌分类树（含系列统计）
  const cats = await db.category.findMany({
    where: { brandId: brand.id },
    include: {
      translations: true,
      productLines: {
        where: { isActive: true },
        include: { translations: true, _count: { select: { products: { where: { isActive: true } } } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const products = await db.product.findMany({
    where: { brandId: brand.id, isActive: true },
    include: {
      translations: true,
      productLine: {
        include: { translations: true, brand: { include: { translations: true } } },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { model: "asc" }],
  });

  // 产品计数（按分类）
  const countByCat = new Map<string, number>();
  for (const p of products) {
    countByCat.set(p.categoryId, (countByCat.get(p.categoryId) ?? 0) + 1);
  }
  // 顶层品类计数 = 自身 + 所有子孙分类
  const catById = new Map(cats.map((c) => [c.id, c]));
  const countWithDescendants = (id: string): number => {
    let n = countByCat.get(id) ?? 0;
    for (const c of cats) {
      if (c.parentId === id) n += countWithDescendants(c.id);
    }
    return n;
  };

  const categories = cats.map((c) => {
    return {
      id: c.id,
      code: c.code,
      name: t(c.translations, locale, "name") || c.code,
      parentId: c.parentId,
      icon: c.icon,
      count: countWithDescendants(c.id),
      series: c.productLines
        .filter((l) => l._count.products > 0)
        .map((l) => ({
          id: l.id,
          code: l.code,
          name: t(l.translations, locale, "name") || l.code,
          count: l._count.products,
        })),
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-sky-600">
          {isEn ? "Home" : "首页"}
        </Link>
        <span className="mx-2">/</span>
        <Link href="/brands" className="hover:text-sky-600">
          {isEn ? "Brands" : "代理品牌"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{brandName}</span>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {brand.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo} alt={brandName} className="h-16 object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{brandName}</h1>
              <div className="text-sm text-slate-400">
                {bt["en"]?.name ?? ""}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-3 text-sky-600 hover:underline"
                  >
                    {isEn ? "Official Site" : "访问官网"} ↗
                  </a>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/contact"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            {isEn ? `Get ${brandName} Quote` : `获取 ${brandName} 产品报价`}
          </Link>
        </div>
        {bt[locale]?.description && (
          <p className="mt-4 text-sm leading-6 text-slate-600">{bt[locale].description}</p>
        )}
      </div>

      {/* 品类 → 系列 → 产品 联动筛选 */}
      <BrandFilterExplorer categories={categories} products={products as any} />
    </div>
  );
}
