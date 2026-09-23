import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBrand, getBrandCategories } from "@/lib/brand";
import { getBrandCategoryStats } from "@/lib/brand-stats";
import { getBrandLocale, brandPath } from "@/lib/brand-locale";
import { getSiteSettings } from "@/lib/site";
import BrandSeriesExplorer from "@/components/brand-series-explorer";
import { FadeIn, CountUp } from "@/components/motion";
import { ArrowUpRight, Phone } from "lucide-react";

type BrandHeroConfig = {
  tagline?: { zh?: string; en?: string };
  intro?: { zh?: string; en?: string };
  imageUrl?: string;
  primaryCta?: { text?: { zh?: string; en?: string }; href?: string };
  secondaryCta?: { text?: { zh?: string; en?: string }; href?: string };
  stats?: { value: string; label: { zh?: string; en?: string } }[];
};

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
  const topCats = categories.filter((c) => !c.parentId && c.showInNav);
    // 计算品类统计：每个品类下的产品系列和型号数
  const dbMod = await import("@/lib/db");
  const productLines = await dbMod.db.productLine.findMany({
    where: { brandId: brand.id, products: { some: { isActive: true } } },
    include: {
      category: true,
      products: { where: { isActive: true }, select: { id: true } },
      translations: true,
    },
  });
  // 构建子品类到父品类的映射
  const catParentMap: Record<string, string> = {};
  const allCats = await (await import("@/lib/db")).db.category.findMany({
    where: { brandId: brand.id },
    select: { id: true, parentId: true },
  });
  for (const c of allCats) {
    catParentMap[c.id] = c.parentId || c.id;
  }
  const findTopCatId = (cid: string): string => {
    let cur = cid;
    let guard = 0;
    while (catParentMap[cur] && catParentMap[cur] !== cur && guard < 10) {
      cur = catParentMap[cur];
      guard++;
    }
    return cur;
  };
  const stats: Record<string, { models: number; series: { name: string; code: string; models: number }[] }> = {};
  for (const pl of productLines) {
    if (!pl.categoryId) continue;
    const topId = findTopCatId(pl.categoryId);
    if (!stats[topId]) stats[topId] = { models: 0, series: [] };
    const plName = pl.translations.find((t: any) => t.locale === locale)?.name || pl.name;
    stats[topId].series.push({
      name: plName,
      code: pl.code,
      models: pl.products.length,
    });
    stats[topId].models += pl.products.length;
  }

  // 读取配置
  const settings = await getSiteSettings(locale);
  let heroConfig: BrandHeroConfig = {};
  try {
    const raw = await (await import("@/lib/db")).db.siteSetting.findUnique({
      where: { key_locale: { key: `brand_hero_config:${brand.code.toLowerCase()}`, locale: null } },
    });
    if (raw?.value) heroConfig = JSON.parse(raw.value);
  } catch { /* ignore */ }

  // Hero 图：配置 > 第一个产品图 > 占位
  let heroImage: string | null = heroConfig.imageUrl ?? null;
  if (!heroImage) {
    const firstProduct = await (await import("@/lib/db")).db.product.findFirst({
      where: { brandId: brand.id, isActive: true, coverImage: { not: null } },
      select: { coverImage: true },
      orderBy: { sortOrder: "asc" },
    });
    heroImage = firstProduct?.coverImage ?? null;
  }

  // Tagline fallback
  const tagline =
    heroConfig.tagline?.[locale as "zh" | "en"] ||
    brandDesc.slice(0, 30) ||
    (isEn
      ? `${brandName} test & measurement instruments`
      : `${brandName} 测试测量仪器`);

  // Intro fallback（截断到 150 字）
  const introRaw =
    heroConfig.intro?.[locale as "zh" | "en"] || brandDesc || "";
  const intro = introRaw.length > 150 ? introRaw.slice(0, 150) + "…" : introRaw;

  // Stats fallback
  const brandStats = heroConfig.stats ?? [
    { value: "1975", label: { zh: "成立年份", en: "Founded" } },
    { value: "50+", label: { zh: "年行业经验", en: "Years Experience" } },
    { value: "400+", label: { zh: "产品种类", en: "Products" } },
    { value: "ISO+CE", label: { zh: "国际认证", en: "Certified" } },
  ];

  // 简介分段
  const descParagraphs = brandDesc
    ? brandDesc.split(/[。；;]/).filter((s) => s.trim().length > 10)
    : [];

  return (
    <div>
      {/* 1. Hero 区 — 上下结构：文字在上，Banner 大图在下 */}
      <section className="bg-white">
        {/* Banner 大图（通栏出血） */}
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt={brandName}
            className="h-[200px] w-full object-cover sm:h-[280px] lg:h-[420px]"
          />
        )}
        {/* 文字区 */}
        <div className="ui-wrap py-12 sm:py-16">
          {brand.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt={brandName} className="h-8 sm:h-10 object-contain" />
          )}
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--ui-ink)]">{brandName}</h1>
          <p className="mt-3 text-base leading-7 text-[var(--ui-mute)]">{tagline}</p>
          {intro && (
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ui-mute)]">{intro}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {topCats[0] && (
              <Link
                href={`${base}/category/${topCats[0].code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
                className="ui-btn-primary"
              >
                {isEn ? "Browse Products" : "浏览产品"}
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            )}
            <Link href={`${base}/contact`} className="ui-btn-ghost">
              {isEn ? "Get a Quote" : "获取报价"}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. 品牌数据带 */}
      <section className="border-b border-[var(--ui-line)] bg-[var(--ui-sunken)]">
        <div className="ui-wrap py-10">
          <FadeIn>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {brandStats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-semibold text-[var(--ui-ink)] sm:text-5xl">
                    <CountUp value={s.value} />
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-wide text-[var(--ui-mute)]">
                    {s.label[locale as "zh" | "en"] ?? s.label.zh}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 3. 品牌简介区 */}
      {brandDesc && (
        <section className="bg-white">
          <div className="ui-wrap ui-section">
            <div className="max-w-3xl">
              <FadeIn>
                <p className="ui-eyebrow">{isEn ? "About" : "品牌简介"}</p>
                <h2 className="ui-h2 mt-2">{isEn ? `About ${brandName}` : `${brandName} 简介`}</h2>
              </FadeIn>
              <div className="mt-6 space-y-4">
                {descParagraphs.length > 0 ? (
                  descParagraphs.slice(0, 3).map((p, i) => (
                    <FadeIn key={i} delay={i * 100}>
                      <p className="text-sm leading-7 text-[var(--ui-mute)]">{p.trim()}。</p>
                    </FadeIn>
                  ))
                ) : (
                  <FadeIn>
                    <p className="text-sm leading-7 text-[var(--ui-mute)]">{brandDesc}</p>
                  </FadeIn>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. 产品系列 */}
      <section className="border-y border-[var(--ui-line)] bg-[var(--ui-sunken)]">
        <div className="ui-wrap ui-section">
          <FadeIn>
            <div className="max-w-xl">
              <p className="ui-eyebrow">{isEn ? "Series" : "产品系列"}</p>
              <h2 className="ui-h2 mt-2">{isEn ? "Browse by Category" : "按品类浏览"}</h2>
              <p className="ui-lede">
                {isEn ? `Explore ${brandName} series by category` : `按品类浏览 ${brandName} 全系列`}
              </p>
            </div>
          </FadeIn>
          <div className="mt-10">
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

      {/* 5. 联系 CTA 带 */}
      <section className="bg-[var(--ui-ink)] text-white">
        <div className="ui-wrap py-10 sm:py-14">
          <FadeIn>
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold sm:text-2xl">
                  {isEn ? "Need selection support or a quote?" : "需要选型支持或报价？"}
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  {isEn
                    ? "Our engineers will help you choose the right instrument."
                    : "我们的工程师将为您推荐最合适的仪器。"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`${base}/contact`}
                  className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                >
                  {isEn ? "Get a Quote" : "获取报价"}
                </Link>
                {settings.phone && (
                  <a
                    href={`tel:${settings.phone}`}
                    className="flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <Phone className="h-4 w-4" />
                    {settings.phone}
                  </a>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
