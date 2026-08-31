import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getSiteSettings, getSiteCategories, getSiteBrands, t } from "@/lib/site";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Professional Test & Measurement Instrument Supplier | Multi-Brand"
      : "专业测试测量仪器供应服务商 | 多品牌代理",
    description: isEn
      ? "Authorized distributor of oscilloscopes, signal generators, power supplies, multimeters and more from world-renowned brands."
      : "专业代理销售全球知名品牌的示波器、信号源、电源、万用表等测试测量仪器，提供选型咨询与技术支持。",
    alternates: {
      languages: {
        "zh-CN": "/zh",
        "en-US": "/en",
      },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";

  const [settings, categories, brands] = await Promise.all([
    getSiteSettings(locale),
    getSiteCategories(locale),
    getSiteBrands(locale),
  ]);

  const topCategories = categories.filter((c) => !c.parentId);

  const [featuredProducts, latestProducts] = await Promise.all([
    db.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        productLine: {
          include: { brand: { include: { translations: true } }, translations: true },
        },
        translations: true,
        paramValues: { include: { paramDefinition: { include: { translations: true } } } },
      },
      take: 6,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    db.product.findMany({
      where: { isActive: true },
      include: {
        productLine: {
          include: { brand: { include: { translations: true } }, translations: true },
        },
        translations: true,
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const brandCounts = await db.product.groupBy({
    by: ["brandId"],
    _count: true,
    where: { isActive: true },
  });
  const countMap = Object.fromEntries(brandCounts.map((b) => [b.brandId, b._count]));

  const I = {
    heroSub: isEn
      ? "Authorized distributor of world-renowned test & measurement instruments. Covering oscilloscopes, signal generators, power supplies, multimeters, spectrum analyzers and more, with one-stop selection, comparison, bulk supply and technical support."
      : "专业代理全球知名品牌的测试测量仪器，覆盖示波器、信号源、电源、万用表、频谱分析等全品类，提供产品选型、参数对比、批量供应与技术支持一站式服务。",
    browseAll: isEn ? "Browse All Products" : "浏览全部产品",
    getQuote: isEn ? "Get a Quote" : "获取报价",
    brandsTitle: isEn ? "Partner Brands" : "代理品牌",
    brandsSub: isEn
      ? `We represent ${brands.length} world-renowned test & measurement brands`
      : `我们代理 ${brands.length} 个国际知名测试测量仪器品牌`,
    productsCount: isEn ? "products" : "款产品",
    featuredTitle: isEn ? "Featured Products" : "推荐产品",
    viewAll: isEn ? "View All" : "查看全部",
    categoriesTitle: isEn ? "Product Categories" : "产品类别",
    categoriesSub: isEn ? "Browse and filter by category" : "按类别浏览并筛选选型",
    aboutTitle: isEn ? "About Us" : "关于我们",
    about: isEn
      ? `${settings.siteName} is a professional test & measurement instrument supplier in close partnership with world-renowned brands, serving R&D institutes, universities, electronics, communications and new energy industries with selection, parameter comparison, bulk supply and after-sales support.`
      : `${settings.siteName} 是一家专业的测试测量仪器供应服务商，与多家国际知名仪器品牌保持深度合作，为科研院所、高校、电子制造、通信、新能源等行业客户提供仪器选型、参数对比、批量供应与售后支持服务。我们拥有专业的技术团队，可为您提供一对一的产品选型建议。`,
    statBrands: isEn ? "Partner Brands" : "代理品牌",
    statModels: isEn ? "Product Models" : "产品型号",
    statSupport: isEn ? "Tech Support" : "技术支持",
    noImage: isEn ? "No image" : "暂无图片",
    featured: isEn ? "Featured" : "推荐",
    viewDetail: isEn ? "View Details" : "查看详情",
    yes: isEn ? "Yes" : "是",
    no: isEn ? "No" : "否",
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {isEn ? "Professional Test & Measurement Instrument Supplier" : settings.siteName}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            {I.heroSub}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/products"
              className="rounded-md bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400"
            >
              {I.browseAll}
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {I.getQuote}
            </Link>
          </div>
        </div>
      </section>

      {/* 品牌墙 */}
      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-xl font-bold text-slate-900">{I.brandsTitle}</h2>
          <p className="mt-1 text-center text-sm text-slate-500">{I.brandsSub}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/brands/${b.code}`}
                className="rounded-lg border border-slate-200 px-5 py-3 text-center transition hover:border-sky-300 hover:shadow-sm"
              >
                <div className="text-sm font-semibold text-slate-800">{b.name}</div>
                <div className="text-xs text-slate-400">{b.enName}</div>
                {countMap[b.id] ? (
                  <div className="mt-1 text-xs text-sky-600">
                    {countMap[b.id]} {I.productsCount}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 热门产品 */}
      {featuredProducts.length > 0 && (
        <section className="bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{I.featuredTitle}</h2>
              <Link href="/products" className="text-sm text-sky-600 hover:underline">
                {I.viewAll} →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((p) => {
                const pt = Object.fromEntries(p.translations.map((tr) => [tr.locale, tr]));
                const bt = Object.fromEntries(
                  p.productLine.brand.translations.map((tr) => [tr.locale, tr])
                );
                const highlights = p.paramValues
                  .filter((pv) => pv.isHighlight)
                  .slice(0, 2)
                  .map((pv) => {
                    const dt = Object.fromEntries(
                      pv.paramDefinition.translations.map((tr) => [tr.locale, tr])
                    );
                    const val =
                      pv.valueNumber ??
                      pv.valueString ??
                      (pv.valueBoolean ? I.yes : I.no);
                    return `${dt[locale]?.name ?? dt["zh"]?.name ?? pv.paramDefinition.key}: ${val}${pv.paramDefinition.unit ?? ""}`;
                  });
                return (
                  <Link
                    key={p.id}
                    href={`/products/${encodeURIComponent(p.model)}`}
                    className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:border-sky-300 hover:shadow-md"
                  >
                    {p.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.coverImage}
                        alt={pt[locale]?.name ?? pt["zh"]?.name ?? p.model}
                        className="h-32 w-full rounded object-contain"
                      />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center rounded bg-slate-100 text-slate-400">
                        {I.noImage}
                      </div>
                    )}
                    <div className="mt-3 font-mono text-sm font-bold text-slate-900">{p.model}</div>
                    <div className="text-sm text-slate-600">
                      {pt[locale]?.name ?? pt["zh"]?.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {bt[locale]?.name ?? bt["zh"]?.name ?? ""} · {p.productLine.code}
                    </div>
                    {highlights.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {highlights.map((h, i) => (
                          <div
                            key={i}
                            className="rounded bg-sky-50 px-2 py-1 text-xs text-sky-700"
                          >
                            {h}
                          </div>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 产品类别 */}
      {topCategories.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-xl font-bold text-slate-900">{I.categoriesTitle}</h2>
            <p className="mt-1 text-center text-sm text-slate-500">{I.categoriesSub}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {topCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.code}`}
                  className="rounded-lg border border-slate-200 p-6 text-center transition hover:border-sky-300 hover:bg-sky-50/50"
                >
                  <div className="text-2xl">{c.icon ?? "🔬"}</div>
                  <div className="mt-2 font-semibold text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.enName}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 关于我们 */}
      <section className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-xl font-bold text-slate-900">{I.aboutTitle}</h2>
          <p className="mt-4 leading-7 text-slate-600">{settings.companyIntro || I.about}</p>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            {[
              { num: String(brands.length), label: I.statBrands },
              { num: "1000+", label: I.statModels },
              { num: "7×24", label: I.statSupport },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-white p-4">
                <div className="text-2xl font-bold text-sky-600">{s.num}</div>
                <div className="mt-1 text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
