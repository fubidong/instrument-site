import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBrand, getBrandCategories } from "@/lib/brand";
import { getSeriesModels } from "@/lib/brand-series";
import { getBrandLocale, brandPath } from "@/lib/brand-locale";

export default async function BrandSeriesPage({
  params,
}: {
  params: Promise<{ brand: string; category: string; series: string }>;
}) {
  const { brand: brandCode, category: catCode, series: seriesCode } = await params;
  const locale = await getBrandLocale();
  setRequestLocale(locale);
  const isEn = locale === "en";

  const brand = await getBrand(brandCode);
  if (!brand || !brand.isActive) notFound();
  const brandName = brand.name[locale]?.name ?? brand.name["zh"]?.name ?? brand.code;
  const base = brandPath(brand.code, locale);

  const categories = await getBrandCategories(brand.id, locale);
  const cat = categories.find((c) => c.code.toLowerCase() === catCode.toLowerCase());
  if (!cat) notFound();

  const series = await getSeriesModels(brand.id, decodeURIComponent(seriesCode));
  if (!series.id) notFound();

  const I = {
    models: isEn ? "Models" : "型号",
    view: isEn ? "View Details" : "查看详情",
    noData: isEn ? "No models yet" : "暂无型号",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* 面包屑 */}
      <div className="mb-6 text-sm text-slate-500">
        <Link href={base} className="hover:text-sky-600">{brandName}</Link>
        <span className="mx-2">/</span>
        <Link href={`${base}/category/${cat.code.toLowerCase()}`} className="hover:text-sky-600">
          {cat.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{series.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">{series.name}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {series.code} · {series.models.length} {I.models}
      </p>

      {/* 型号网格 */}
      {series.models.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-slate-200 py-16 text-center text-slate-400">
          {I.noData}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {series.models.map((m) => (
            <Link
              key={m.id}
              href={`${base}/category/${cat.code.toLowerCase()}/${encodeURIComponent(series.code)}/${encodeURIComponent(m.model)}`}
              className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:border-sky-300 hover:shadow-md"
            >
              {m.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.coverImage} alt={m.model} className="h-32 w-full rounded object-contain" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded bg-slate-100 text-slate-400">
                  {isEn ? "N/A" : "无图"}
                </div>
              )}
              <div className="mt-3 font-mono text-sm font-bold text-slate-900">{m.model}</div>
              <div className="text-xs text-slate-400">{m.name}</div>
              {m.highlights.length > 0 && (
                <div className="mt-2 space-y-1">
                  {m.highlights.map((h, i) => (
                    <div key={i} className="rounded bg-sky-50 px-2 py-1 text-xs text-sky-700">
                      {h}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 text-xs font-medium text-sky-600 group-hover:underline">{I.view} →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
