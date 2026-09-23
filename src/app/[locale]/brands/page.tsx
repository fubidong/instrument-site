import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSiteBrands, t } from "@/lib/site";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { ArrowRight, ShieldCheck, BadgeCheck, Wrench } from "lucide-react";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function BrandsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const brands = await getSiteBrands(locale);

  const counts = await db.product.groupBy({
    by: ["brandId"],
    _count: true,
    where: { isActive: true },
  });
  const countMap = Object.fromEntries(counts.map((b) => [b.brandId, b._count]));

  // 补充：一句话定位（品牌描述）+ 各品牌核心顶层品类概览
  const ids = brands.map((b) => b.id);
  const brandRows = await db.brand.findMany({
    where: { id: { in: ids } },
    include: { translations: true },
  });
  const descMap = new Map<string, string>(
    brandRows.map((r) => [
      r.id,
      t(r.translations, locale, "description") || t(r.translations, "zh", "description"),
    ])
  );

  const topCats = await db.category.findMany({
    where: { brandId: { in: ids }, showInNav: true, parentId: null },
    include: { translations: true },
    orderBy: { sortOrder: "asc" },
  });
  const catsByBrand = new Map<string, string[]>();
  for (const c of topCats) {
    if (!c.brandId) continue;
    const name = t(c.translations, locale, "name") || c.code;
    const arr = catsByBrand.get(c.brandId) ?? [];
    if (arr.length < 4) arr.push(name);
    catsByBrand.set(c.brandId, arr);
  }

  const trustBadges = [
    { icon: ShieldCheck, label: isEn ? "Authorized Partner" : "授权代理" },
    { icon: BadgeCheck, label: isEn ? "Genuine Products" : "原厂正品" },
    { icon: Wrench, label: isEn ? "Technical Support" : "技术支持" },
  ];

  return (
    <div className="ui-wrap ui-section">
      <p className="ui-eyebrow">{isEn ? "Partner Network" : "品牌合作"}</p>
      <h1 className="ui-h1 mt-2">{isEn ? "Partner Brands" : "代理品牌"}</h1>
      <p className="ui-lede">
        {isEn
          ? "We maintain deep partnerships with world-renowned test & measurement brands, providing genuine products, technical support and professional procurement."
          : "我们与多家国际知名测试测量仪器品牌保持深度合作，为您提供原厂正品、技术支持与专业采购服务。"}
      </p>

      {/* 信任条：克制描边徽章 */}
      <div className="mt-8 flex flex-wrap gap-2.5">
        {trustBadges.map(({ icon: Icon, label }) => (
          <span key={label} className="ui-badge ui-badge-trust">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {label}
          </span>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const cats = catsByBrand.get(b.id) ?? [];
          const desc =
            descMap.get(b.id) ||
            (cats.length
              ? isEn
                ? `Specializing in ${cats.join(" · ")}`
                : `专注于 ${cats.join("、")} 领域`
              : "");
          return (
            <Link
              key={b.id}
              href={`/brands/${b.code}`}
              className="ui-card group flex flex-col p-6 transition-colors duration-200 hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="ui-num text-[11px] uppercase tracking-[0.15em] text-[var(--ui-mute)]">
                    {b.code}
                  </div>
                  <div className="mt-1.5 break-words text-lg font-semibold text-[var(--ui-ink)]">
                    {b.name}
                  </div>
                  <div className="break-words text-sm text-[var(--ui-mute)]">{b.enName}</div>
                  <div className="mt-2.5">
                    <span className="ui-badge ui-badge-trust">
                      <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                      {isEn ? "Authorized" : "授权代理"}
                    </span>
                  </div>
                </div>
                {b.logo && (
                  <div className="relative h-10 w-24 shrink-0">
                    <Image
                      src={b.logo}
                      alt={b.name}
                      fill
                      sizes="96px"
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              {desc && (
                <p className="mt-4 line-clamp-3 min-h-[3rem] text-sm leading-6 text-[var(--ui-mute)]">
                  {desc}
                </p>
              )}

              {cats.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {cats.map((name) => (
                    <span
                      key={name}
                      className="ui-badge border-[var(--ui-line)] text-[var(--ui-mute)]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-[var(--ui-line)] pt-4 mt-6">
                <span className="text-sm text-[var(--ui-mute)]">
                  <span className="ui-num font-semibold text-[var(--ui-ink)]">
                    {countMap[b.id] ?? 0}
                  </span>{" "}
                  {isEn ? "products" : "款产品"}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
                  {isEn ? "View" : "查看"}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {brands.length === 0 && (
        <div className="ui-card mt-10 p-16 text-center text-sm text-[var(--ui-mute)]">
          {isEn ? "No brand information yet" : "暂无品牌信息"}
        </div>
      )}
    </div>
  );
}
