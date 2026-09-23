import { Link } from "@/i18n/navigation";
import SiteLink from "next/link";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getSiteSettings, getSiteCategories, getSiteBrands, t } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { brandPath } from "@/lib/brand-locale";
import { CountUp } from "@/components/motion";
import HeroBanner from "@/components/hero-banner";
import {
  Activity,
  Waves,
  Gauge,
  Zap,
  BarChart3,
  CircuitBoard,
  BatteryCharging,
  ScanLine,
  Thermometer,
  Microscope,
  Camera,
  Globe,
  Cpu,
  Boxes,
  Search,
  Headphones,
  ClipboardList,
  ArrowUpRight,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

// Hallmark · genre: technical-catalog · macrostructure: swiss editorial hero + hairline card grids · design-system: ui-* utilities · designed-as-app

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

/** Map a top-level category to a restrained lucide icon by code/name keywords. */
function categoryIcon(code: string, name: string): LucideIcon {
  const k = `${code} ${name}`.toLowerCase();
  if (/oscill|示波|波形/.test(k)) return Activity;
  if (/signal|generat|信号|源|波形源/.test(k)) return Waves;
  if (/power|supply|电源|直流|电池/.test(k)) return Zap;
  if (/multimet|meter|万用|电表|表/.test(k)) return Gauge;
  if (/spectr|analyz|频谱|分析|网络分析/.test(k)) return BarChart3;
  if (/logic|digital|逻辑|数字/.test(k)) return CircuitBoard;
  if (/batter|电池/.test(k)) return BatteryCharging;
  if (/optic|fiber|laser|光|激光|光纤/.test(k)) return ScanLine;
  if (/temp|thermal|红外|热像|温度/.test(k)) return Camera;
  if (/microscop|显微/.test(k)) return Microscope;
  if (/climate|environment|温|湿|环境/.test(k)) return Thermometer;
  if (/network|communic|通信|网络|射频|射频/.test(k)) return Globe;
  if (/semicond|device|半导体|器件/.test(k)) return Cpu;
  return Boxes;
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
  const totalModels = await db.product.count({ where: { isActive: true } });

  // 品类计数和品类代表图
  const catProducts = await db.product.findMany({
    where: { isActive: true, coverImage: { not: null } },
    select: { categoryId: true, coverImage: true },
  });
  const countByCategory: Record<string, number> = {};
  const categoryImages: Record<string, string> = {};
  for (const p of catProducts) {
    if (p.categoryId) {
      countByCategory[p.categoryId] = (countByCategory[p.categoryId] ?? 0) + 1;
      if (!categoryImages[p.categoryId] && p.coverImage) {
        categoryImages[p.categoryId] = p.coverImage;
      }
    }
  }


  // 品牌按产品数从多到少排序
  const sortedBrands = [...brands].sort((a, b) => (countMap[b.id] ?? 0) - (countMap[a.id] ?? 0));

  const I = {
    eyebrow: isEn ? "Authorized Distributor" : "授权代理供应",
    heroTitle: isEn
      ? "Professional Test & Measurement Instruments, Sourced Right"
      : "专业测试测量仪器，一站选对、供好",
    heroSub: isEn
      ? "Authorized distributor of world-renowned test & measurement instruments. Covering oscilloscopes, signal generators, power supplies, multimeters, spectrum analyzers and more, with one-stop selection, comparison, bulk supply and technical support."
      : "专业代理全球知名品牌的测试测量仪器，覆盖示波器、信号源、电源、万用表、频谱分析等全品类，提供产品选型、参数对比、批量供应与技术支持一站式服务。",
    browseCatalog: isEn ? "Browse Product Catalog" : "浏览产品目录",
    getQuote: isEn ? "Get a Quote" : "获取报价",
    heroTrustBrand: isEn ? "Authorized Brands" : "授权品牌",
    heroTrustModel: isEn ? "Active Models" : "在架型号",
    heroTrustYear: isEn ? "Serving Engineers" : "服务工程师客户",
    heroTrustYearVal: isEn ? "10+ yrs" : "10 年+",
    servicesTitle: isEn ? "How We Support You" : "我们如何支持您",
    servicesSub: isEn
      ? "From first selection to after-sales, a dedicated team for engineering and procurement."
      : "从初次选型到售后，为工程师与采购提供专属支持。",
    svc1Title: isEn ? "Selection Consulting" : "选型咨询",
    svc1Desc: isEn
      ? "Compare parameters across brands and models to fit your budget and specs."
      : "跨品牌、跨型号对比参数，匹配预算与技术指标。",
    svc2Title: isEn ? "Technical Support" : "技术支持",
    svc2Desc: isEn
      ? "Application guidance and instrument onboarding from an experienced team."
      : "资深团队提供应用指导与仪器上机支持。",
    svc3Title: isEn ? "Inquiry & Procurement" : "询价采购",
    svc3Desc: isEn
      ? "Quotation, bulk supply and lead-time planning for procurement teams."
      : "为采购团队提供报价、批量供货与交期规划。",
    brandsTitle: isEn ? "Partner Brands" : "代理品牌",
    brandsSub: isEn
      ? `We represent ${brands.length} world-renowned test & measurement brands`
      : `我们代理 ${brands.length} 个国际知名测试测量仪器品牌`,
    authorized: isEn ? "Authorized" : "授权",
    productsCount: isEn ? "products" : "款产品",
    featuredTitle: isEn ? "Featured Products" : "推荐产品",
    featuredSub: isEn ? "Handpicked instruments in active supply" : "精选在架主力机型",
    viewAll: isEn ? "View All" : "查看全部",
    categoriesTitle: isEn ? "Product Categories" : "核心品类",
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
      {/* ===== Hero — 上下结构：文字在上，品牌 logo 墙在下 ===== */}
      <section className="bg-white">
        {/* 文字区 */}
        <div className="ui-wrap py-12 sm:py-16">
          <span className="ui-badge ui-badge-trust">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
            {I.eyebrow}
          </span>
          <h1 className="ui-h1 mt-5">{I.heroTitle}</h1>
          <p className="ui-lede">{I.heroSub}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/products" className="ui-btn-primary">
              {I.browseCatalog}
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link href="/contact" className="ui-btn-ghost">
              {I.getQuote}
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-[var(--ui-line)] pt-6">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ui-mute)]">
                {I.heroTrustBrand}
              </dt>
              <dd className="mt-1 text-4xl font-semibold text-[var(--ui-ink)] sm:text-5xl">
                <CountUp value={String(brands.length)} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ui-mute)]">
                {I.heroTrustModel}
              </dt>
              <dd className="mt-1 text-4xl font-semibold text-[var(--ui-ink)] sm:text-5xl">
                <CountUp value={String(totalModels)} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ui-mute)]">
                {I.heroTrustYear}
              </dt>
              <dd className="mt-1 text-4xl font-semibold text-[var(--ui-ink)] sm:text-5xl">
                <CountUp value={I.heroTrustYearVal} />
              </dd>
            </div>
          </dl>
        </div>
        {/* Banner 大图（通栏，从配置读取） */}
        {settings.homeBanners && settings.homeBanners.length > 0 && settings.homeBanners[0]?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.homeBanners[0].imageUrl}
            alt=""
            className="h-[200px] w-full object-cover sm:h-[280px] lg:h-[420px]"
          />
        )}
      </section>

      {/* ===== Service capabilities — sunken band, 3 cards ===== */}
      <section className="ui-sunken border-b border-[var(--ui-line)]">
        <div className="ui-wrap ui-section">
          <div className="max-w-xl">
            <p className="ui-eyebrow">{isEn ? "Why us" : "服务能力"}</p>
            <h2 className="ui-h2 mt-2">{I.servicesTitle}</h2>
            <p className="ui-lede">{I.servicesSub}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: Search, title: I.svc1Title, desc: I.svc1Desc },
              { Icon: Headphones, title: I.svc2Title, desc: I.svc2Desc },
              { Icon: ClipboardList, title: I.svc3Title, desc: I.svc3Desc },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="ui-card ui-card-pad">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--ui-line)] bg-white text-[var(--primary)]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="ui-h3 mt-4">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ui-mute)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Core categories — 简洁品类卡片 ===== */}
      {topCategories.length > 0 && (
        <section className="bg-white">
          <div className="ui-wrap ui-section">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <p className="ui-eyebrow">{isEn ? "Categories" : "品类"}</p>
                <h2 className="ui-h2 mt-2">{I.categoriesTitle}</h2>
                <p className="ui-lede">{I.categoriesSub}</p>
              </div>
            </div>

            {/* 品类卡片 */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {topCategories.slice(0, 16).map((c) => {
                const Icon = categoryIcon(c.code, c.name);
                const catCount = countByCategory[c.code] ?? 0;
                return (
                  <Link
                    key={c.id}
                    href={`/products?category=${c.code}`}
                    className="group flex flex-col items-center rounded-lg border border-[var(--ui-line)] bg-white p-4 transition-colors duration-200 hover:border-[var(--primary)]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/5 text-[var(--primary)]">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="mt-3 text-center text-sm font-medium text-[var(--ui-ink)]">{c.name}</div>
                    {catCount > 0 && (
                      <div className="mt-0.5 text-center text-xs text-[var(--ui-mute)]">{catCount} {isEn ? "models" : "款"}</div>
                    )}
                  </Link>
                );
              })}
            </div>

            {topCategories.length > 16 && (
              <div className="mt-6 text-center">
                <Link href="/products" className="ui-btn-ghost">
                  {isEn ? "View All Categories" : "查看全部品类"}
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== Partner brands — logo cards, trusted signal ===== */}
      <section className="ui-sunken border-y border-[var(--ui-line)]">
        <div className="ui-wrap ui-section">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="ui-eyebrow">{isEn ? "Brands" : "品牌"}</p>
              <h2 className="ui-h2 mt-2">{I.brandsTitle}</h2>
              <p className="ui-lede">{I.brandsSub}</p>
              <p className="mt-2 text-xs text-[var(--ui-mute)]">
                {isEn ? "All brands are officially authorized distributors" : "所有品牌均为官方授权代理"}
              </p>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sortedBrands.slice(0, 12).map((b) => (
              <SiteLink
                key={b.id}
                href={brandPath(b.code, isEn ? "en" : "zh")}
                className="ui-card group flex flex-col items-center p-5 transition-colors duration-200 hover:border-[var(--primary)]"
              >
                {/* 品牌 logo */}
                <div className="flex items-center justify-center">
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt={b.name} className="h-8 max-w-[120px] object-contain transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--ui-sunken)] text-[var(--primary)]">
                      <span className="text-sm font-bold">{b.name.slice(0, 1)}</span>
                    </div>
                  )}
                </div>
                {/* 品牌名 */}
                <div className="mt-3 text-center">
                  <div className="truncate text-sm font-semibold text-[var(--ui-ink)]">{b.name}</div>
                  <div className="mt-0.5 truncate text-xs text-[var(--ui-mute)]">{b.enName}</div>
                </div>
                {/* 产品数 */}
                {countMap[b.id] ? (
                  <div className="mt-3 border-t border-[var(--ui-line)] pt-3 text-center">
                    <span className="text-xs text-[var(--ui-mute)]">
                      <span className="font-semibold text-[var(--ui-ink)]">{countMap[b.id]}</span> {I.productsCount}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 border-t border-[var(--ui-line)] pt-3" />
                )}
              </SiteLink>
            ))}
          </div>
          {sortedBrands.length > 12 && (
            <div className="mt-8 text-center">
              <Link href="/products" className="ui-btn-ghost">
                {isEn ? "View All Brands" : "查看全部品牌"}
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ===== Featured products — hairline catalog cards ===== */}
      {featuredProducts.length > 0 && (
        <section className="bg-white">
          <div className="ui-wrap ui-section">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <p className="ui-eyebrow">{isEn ? "Featured" : "推荐"}</p>
                <h2 className="ui-h2 mt-2">{I.featuredTitle}</h2>
                <p className="ui-lede">{I.featuredSub}</p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] transition-colors duration-200 hover:underline"
              >
                {I.viewAll}
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    className="ui-card group flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                  >
                    <div className="relative h-36 w-full overflow-hidden rounded-md border border-[var(--ui-line)] bg-[var(--ui-sunken)]">
                      {p.coverImage ? (
                        <Image
                          src={p.coverImage}
                          alt={pt[locale]?.name ?? pt["zh"]?.name ?? p.model}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-[var(--ui-mute)]">
                          {I.noImage}
                        </div>
                      )}
                      <span className="ui-badge ui-badge-trust absolute left-2 top-2">
                        {I.featured}
                      </span>
                    </div>
                    <div className="mt-4 break-words text-sm font-semibold text-[var(--ui-ink)] transition-colors duration-200 group-hover:text-[var(--primary)]">
                      {p.model}
                    </div>
                    <div className="mt-1 break-words text-sm text-[var(--ui-mute)]">
                      {pt[locale]?.name ?? pt["zh"]?.name}
                    </div>
                    <div className="mt-1 break-words text-xs text-[var(--ui-mute)]">
                      {bt[locale]?.name ?? bt["zh"]?.name ?? ""} · {p.productLine.code}
                    </div>
                    {highlights.length > 0 && (
                      <div className="mt-3 space-y-1 border-t border-[var(--ui-line)] pt-3">
                        {highlights.map((h, i) => (
                          <div
                            key={i}
                            className="break-words text-xs leading-relaxed text-[var(--ui-mute)]"
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

      {/* ===== About — real metrics only ===== */}
      <section className="ui-sunken border-t border-[var(--ui-line)]">
        <div className="ui-wrap py-8 sm:py-10">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-[var(--ui-ink)]">{I.aboutTitle}</h2>
            <p className="mt-3 leading-7 text-sm text-[var(--ui-mute)]">
              {settings.companyIntro || I.about}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[var(--ui-line)] pt-5">
              <div>
                <div className="text-3xl font-semibold text-[var(--primary)]">
                  {brands.length}
                </div>
                <div className="mt-1 text-sm text-[var(--ui-mute)]">{I.statBrands}</div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-[var(--primary)]">
                  {totalModels}
                </div>
                <div className="mt-1 text-sm text-[var(--ui-mute)]">{I.statModels}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
