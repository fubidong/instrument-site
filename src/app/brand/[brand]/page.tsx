import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBrand, getBrandCategories } from "@/lib/brand";
import { getBrandCategoryStats } from "@/lib/brand-stats";
import { getBrandLocale, brandPath } from "@/lib/brand-locale";
import BrandSeriesExplorer from "@/components/brand-series-explorer";

export default async function BrandHomePage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: brandCode } = await params;
  const locale = await getBrandLocale();
  setRequestLocale(locale);
  const isEn = locale === "en";

  const brand = await getBrand(brandCode);
  if (!brand || !brand.isActive) notFound();
  const brandName = brand.name[locale]?.name ?? brand.name["zh"]?.name ?? brand.code;
  const brandDesc = brand.name[locale]?.description ?? brand.name["zh"]?.description ?? "";
  const base = brandPath(brand.code, locale);

  const categories = await getBrandCategories(brand.id, locale);
  const topCats = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);
  const stats = await getBrandCategoryStats(brand.id);

  const I = {
    browse: isEn ? "Browse Products" : "浏览产品",
    models: isEn ? "Models" : "型号",
    viewCategory: isEn ? "View Category" : "进入分类",
    products: isEn ? "Products" : "产品",
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          {brand.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt={brandName} className="mx-auto h-16 object-contain brightness-0 invert" />
          )}
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{brandName}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            {brandDesc ||
              (isEn
                ? `${brandName} test & measurement instruments, from oscilloscopes to spectrum analyzers.`
                : `${brandName} 测试测量仪器，覆盖示波器、信号源、电源、频谱分析仪等全品类。`)}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {topCats[0] && (
              <Link
                href={`${base}/category/${topCats[0].code.toLowerCase()}`}
                className="rounded-md bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400"
              >
                {I.browse}
              </Link>
            )}
            <Link
              href={`${base}/contact`}
              className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {isEn ? "Get a Quote" : "获取报价"}
            </Link>
          </div>
        </div>
      </section>

      {/* 品牌分类导航 */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-xl font-bold text-slate-900">
            {isEn ? "Product Categories" : "产品分类"}
          </h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            {isEn ? `Browse ${brandName} products by category` : `按分类浏览 ${brandName} 产品`}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topCats.map((c) => {
              const subs = childrenOf(c.id);
              const st = stats[c.id];
              return (
                <Link
                  key={c.id}
                  href={`${base}/category/${c.code.toLowerCase()}`}
                  className="group rounded-lg border border-slate-200 bg-white p-6 transition hover:border-sky-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-3xl">{c.icon ?? "🔬"}</div>
                    {st && (
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                        {st.models} {I.models}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 font-semibold text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.enName}</div>
                  {subs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {subs.map((s) => (
                        <span key={s.id} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 text-sm text-sky-600 group-hover:underline">{I.viewCategory} →</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 产品系列（按品类分组 + 交互切换） */}
      <section className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-xl font-bold text-slate-900">
            {isEn ? "Product Series" : "产品系列"}
          </h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            {isEn
              ? `Explore ${brandName} series by category`
              : `按品类浏览 ${brandName} 全系列`}
          </p>
          <div className="mt-6">
            <BrandSeriesExplorer
              cats={topCats.map((c) => ({
                id: c.id,
                code: c.code,
                name: c.name,
                enName: c.enName,
                icon: c.icon,
              }))}
              stats={stats}
              base={base}
              isEn={isEn}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
