import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import { routing } from "@/i18n/routing";
import ProductGrid from "../../products/product-grid";

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
  const brand = await db.brand.findUnique({
    where: { code },
    include: {
      translations: true,
      productLines: {
        where: { isActive: true },
        include: { translations: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!brand || !brand.isActive) notFound();

  const bt = Object.fromEntries(brand.translations.map((tr) => [tr.locale, tr]));
  const brandName = bt[locale]?.name ?? bt["zh"]?.name ?? brand.code;

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

      {brand.productLines.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            {isEn ? "Product Series" : "产品系列"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {brand.productLines.map((line) => {
              const lt = Object.fromEntries(line.translations.map((tr) => [tr.locale, tr]));
              const cnt = products.filter((p) => p.productLineId === line.id).length;
              return (
                <Link
                  key={line.id}
                  href={`/products?line=${line.id}`}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-sky-300"
                >
                  {lt[locale]?.name ?? line.code}
                  <span className="ml-1 text-xs text-slate-400">({cnt})</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {isEn ? "Products" : "产品列表"}
          </h2>
          <span className="text-sm text-slate-400">
            {isEn ? `Total ${products.length}` : `共 ${products.length} 款`}
          </span>
        </div>
        <ProductGrid products={products as any} />
      </div>
    </div>
  );
}
