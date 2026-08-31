import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";
import CompareTable from "./compare-table";
import CompareHydrator from "./compare-hydrator";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const sp = await searchParams;
  const ids = sp.ids?.split(",").filter(Boolean) ?? [];

  let products: any[] = [];
  if (ids.length > 0) {
    products = await db.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: {
        translations: true,
        productLine: {
          include: { brand: { include: { translations: true } }, translations: true },
        },
        paramValues: {
          include: { paramDefinition: { include: { translations: true } } },
          orderBy: { paramDefinition: { sortOrder: "asc" } },
        },
      },
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <CompareHydrator />
      <h1 className="text-2xl font-bold text-slate-900">
        {isEn ? "Product Comparison" : "产品对比"}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {isEn
          ? 'Click "Compare" on product detail pages to compare up to 5 products side by side.'
          : '在产品详情页点击"加入对比"，最多选择 5 个产品进行参数横向对比。'}
      </p>

      {products.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center">
          <p className="text-slate-500">
            {isEn ? "No products selected for comparison" : "还没有选择对比的产品"}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {isEn
              ? 'Please click "Compare" on a product detail page first'
              : '请先在产品详情页点击"加入对比"'}
          </p>
          <a
            href={`/${locale}/products`}
            className="mt-6 inline-block rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
          >
            {isEn ? "Browse Products" : "去浏览产品"}
          </a>
        </div>
      ) : (
        <CompareTable locale={locale} products={products} />
      )}
    </div>
  );
}
