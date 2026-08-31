import Link from "next/link";
import { db } from "@/lib/db";
import { getSiteSettings, getSiteCategories, getSiteBrands, t } from "@/lib/site";

export const metadata = {
  title: "专业测试测量仪器供应服务商 | 多品牌代理",
  description:
    "专业代理销售全球知名品牌的示波器、信号源、电源、万用表等测试测量仪器，提供选型咨询与技术支持。",
};

export default async function HomePage() {
  const [settings, categories, brands] = await Promise.all([
    getSiteSettings(),
    getSiteCategories(),
    getSiteBrands(),
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

  // 品牌计数
  const brandCounts = await db.product.groupBy({
    by: ["brandId"],
    _count: true,
    where: { isActive: true },
  });
  const countMap = Object.fromEntries(brandCounts.map((b) => [b.brandId, b._count]));

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {settings.siteName}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            专业代理全球知名品牌的测试测量仪器 · 覆盖示波器、信号源、电源、万用表、频谱分析等全品类
            <br />
            提供产品选型、参数对比、批量供应与技术支持一站式服务
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/products"
              className="rounded-md bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400"
            >
              浏览全部产品
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              获取报价
            </Link>
          </div>
        </div>
      </section>

      {/* 品牌墙 */}
      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-xl font-bold text-slate-900">代理品牌</h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            我们代理 {brands.length} 个国际知名测试测量仪器品牌
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/brands/${b.code}`}
                className="rounded-lg border border-slate-200 px-5 py-3 text-center transition hover:border-sky-300 hover:shadow-sm"
              >
                <div className="text-sm font-semibold text-slate-800">{b.zhName}</div>
                <div className="text-xs text-slate-400">{b.enName}</div>
                {countMap[b.id] ? (
                  <div className="mt-1 text-xs text-sky-600">{countMap[b.id]} 款产品</div>
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
              <h2 className="text-xl font-bold text-slate-900">推荐产品</h2>
              <Link href="/products" className="text-sm text-sky-600 hover:underline">
                查看全部 →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((p) => {
                const pt = Object.fromEntries(p.translations.map((tr) => [tr.locale, tr]));
                const bt = Object.fromEntries(
                  p.productLine.brand.translations.map((tr) => [tr.locale, tr])
                );
                // 卖点参数
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
                      (pv.valueBoolean ? "是" : "否");
                    return `${dt["zh"]?.name ?? pv.paramDefinition.key}: ${val}${pv.paramDefinition.unit ?? ""}`;
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
                        alt={pt["zh"]?.name ?? p.model}
                        className="h-32 w-full rounded object-contain"
                      />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center rounded bg-slate-100 text-slate-400">
                        暂无图片
                      </div>
                    )}
                    <div className="mt-3 font-mono text-sm font-bold text-slate-900">{p.model}</div>
                    <div className="text-sm text-slate-600">{pt["zh"]?.name}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {bt["zh"]?.name ?? ""} · {p.productLine.code}
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
            <h2 className="text-center text-xl font-bold text-slate-900">产品类别</h2>
            <p className="mt-1 text-center text-sm text-slate-500">按类别浏览并筛选选型</p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {topCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.code}`}
                  className="rounded-lg border border-slate-200 p-6 text-center transition hover:border-sky-300 hover:bg-sky-50/50"
                >
                  <div className="text-2xl">{c.icon ?? "🔬"}</div>
                  <div className="mt-2 font-semibold text-slate-800">{c.zhName}</div>
                  <div className="text-xs text-slate-400">{c.enName}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 公司简介 */}
      <section className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-xl font-bold text-slate-900">关于我们</h2>
          <p className="mt-4 leading-7 text-slate-600">
            {settings.companyIntro ||
              `${settings.siteName} 是一家专业的测试测量仪器供应服务商，与多家国际知名仪器品牌保持深度合作，为科研院所、高校、电子制造、通信、新能源等行业客户提供仪器选型、参数对比、批量供应与售后支持服务。我们拥有专业的技术团队，可为您提供一对一的产品选型建议。`}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            {[
              { num: String(brands.length), label: "代理品牌" },
              { num: "1000+", label: "产品型号" },
              { num: "7×24", label: "技术支持" },
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
