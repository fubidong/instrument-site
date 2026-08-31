import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import ProductGrid from "../../products/product-grid";

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const brand = await db.brand.findUnique({
    where: { code },
    include: {
      translations: true,
      productLines: { where: { isActive: true }, include: { translations: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!brand || !brand.isActive) notFound();

  const bt = Object.fromEntries(brand.translations.map((tr) => [tr.locale, tr]));

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
        <a href="/" className="hover:text-sky-600">首页</a>
        <span className="mx-2">/</span>
        <a href="/brands" className="hover:text-sky-600">代理品牌</a>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{bt["zh"]?.name ?? brand.code}</span>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {brand.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo} alt={bt["zh"]?.name ?? brand.code} className="h-16 object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{bt["zh"]?.name ?? brand.code}</h1>
              <div className="text-sm text-slate-400">
                {bt["en"]?.name ?? ""}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-3 text-sky-600 hover:underline"
                  >
                    访问官网 ↗
                  </a>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/contact"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            获取 {bt["zh"]?.name ?? brand.code} 产品报价
          </Link>
        </div>
        {bt["zh"]?.description && (
          <p className="mt-4 text-sm leading-6 text-slate-600">{bt["zh"].description}</p>
        )}
      </div>

      {/* 系列 */}
      {brand.productLines.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-slate-900">产品系列</h2>
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
                  {lt["zh"]?.name ?? line.code}
                  <span className="ml-1 text-xs text-slate-400">({cnt})</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 产品 */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">产品列表</h2>
          <span className="text-sm text-slate-400">共 {products.length} 款</span>
        </div>
        <ProductGrid products={products as any} />
      </div>
    </div>
  );
}
