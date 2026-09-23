import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import SupportFilters from "./support-filters";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const VALID_TYPES = ["solution", "tech", "faq"] as const;
type Type = (typeof VALID_TYPES)[number];

const TYPE_LABEL_ZH: Record<Type, string> = {
  solution: "解决方案",
  tech: "技术文章",
  faq: "常见问题",
};
const TYPE_LABEL_EN: Record<Type, string> = {
  solution: "Solutions",
  tech: "Technical Articles",
  faq: "FAQ",
};

function normalizeType(raw?: string): Type {
  return (VALID_TYPES as readonly string[]).includes(raw ?? "") ? (raw as Type) : "solution";
}

function fmtDate(d: Date | null, isEn: boolean): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString(isEn ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function SupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; brand?: string; q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const sp = await searchParams;

  const type = normalizeType(sp.type);

  const where: any = { isPublished: true, type };
  if (sp.brand) where.brandId = sp.brand;
  if (sp.q?.trim()) {
    where.translations = {
      some: { title: { contains: sp.q.trim(), mode: "insensitive" } },
    };
  }

  const [articles, brands] = await Promise.all([
    db.supportArticle.findMany({
      where,
      include: {
        brand: { include: { translations: true } },
        translations: true,
      },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      take: 200,
    }),
    db.brand.findMany({
      where: { isActive: true },
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const tabs = (VALID_TYPES as readonly Type[]).map((v) => ({
    value: v,
    label: isEn ? TYPE_LABEL_EN[v] : TYPE_LABEL_ZH[v],
  }));

  const brandOptions = brands.map((b) => ({
    id: b.id,
    name: t(b.translations, locale, "name") || b.code,
  }));

  const typeBadge = (v: Type) =>
    isEn ? TYPE_LABEL_EN[v] : TYPE_LABEL_ZH[v];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">
        {isEn ? "Support Center" : "支持中心"}
      </h1>
      <p className="mt-2 text-slate-500">
        {isEn
          ? "Practical solutions, technical articles and FAQs to help you get the most out of your instruments."
          : "实用解决方案、技术文章与常见问题，助您用好每一台仪器。"}
      </p>

      <div className="mt-6">
        <SupportFilters
          locale={locale}
          tabs={tabs}
          brands={brandOptions}
          currentType={type}
          currentBrand={sp.brand}
          currentQ={sp.q ?? ""}
        />
      </div>

      {articles.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center text-slate-400">
          {isEn
            ? "No articles here yet. Check back soon."
            : "该分类下暂无文章，敬请期待。"}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => {
            const tr = a.translations.find((x) => x.locale === locale) ?? a.translations[0];
            const brandName = a.brand
              ? t(a.brand.translations, locale, "name") || a.brand.code
              : isEn
                ? "General"
                : "通用";
            return (
              <Link
                key={a.id}
                href={`/support/${a.id}`}
                className="group flex flex-col rounded-lg border border-slate-200 bg-white p-5 transition hover:border-sky-300 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">
                    {typeBadge(a.type as Type)}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                    {brandName}
                  </span>
                </div>
                <div className="mt-2 text-base font-semibold text-slate-900 group-hover:text-sky-700">
                  {tr?.title ?? ""}
                </div>
                {tr?.summary && (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{tr.summary}</p>
                )}
                <div className="mt-auto pt-3 text-xs text-slate-400">
                  {fmtDate(a.publishedAt, isEn)}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
