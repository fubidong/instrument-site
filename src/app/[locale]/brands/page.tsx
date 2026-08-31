import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSiteBrands } from "@/lib/site";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">
        {isEn ? "Partner Brands" : "代理品牌"}
      </h1>
      <p className="mt-2 text-slate-500">
        {isEn
          ? "We maintain deep partnerships with world-renowned test & measurement brands, providing genuine products and services."
          : "我们与多家国际知名测试测量仪器品牌保持深度合作，为您提供原厂品质的产品与服务。"}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/brands/${b.code}`}
            className="group rounded-lg border border-slate-200 bg-white p-6 transition hover:border-sky-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-slate-900">{b.name}</div>
                <div className="text-sm text-slate-400">{b.enName}</div>
              </div>
              {b.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logo} alt={b.name} className="h-10 max-w-[100px] object-contain" />
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-sky-600">
                {countMap[b.id] ?? 0} {isEn ? "products" : "款产品"}
              </span>
              <span className="text-sm text-slate-400 group-hover:text-sky-600">
                {isEn ? "View" : "查看"} →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {brands.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center text-slate-400">
          {isEn ? "No brand information yet" : "暂无品牌信息"}
        </div>
      )}
    </div>
  );
}
