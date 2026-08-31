import { Link } from "@/i18n/navigation";

type ProductCard = {
  id: string;
  model: string;
  coverImage: string | null;
  isFeatured: boolean;
  productLine: {
    code: string;
    translations: { locale: string; name: string }[];
    brand: { translations: { locale: string; name: string }[] };
  };
  translations: { locale: string; name: string }[];
};

export default function ProductGrid({
  locale,
  products,
}: {
  locale: string;
  products: ProductCard[];
}) {
  const isEn = locale === "en";
  const L = {
    empty: isEn ? "No matching products found" : "没有找到符合条件的产品",
    emptySub: isEn ? "Please adjust your filters and try again" : "请调整筛选条件后重试",
    noImage: isEn ? "No image" : "暂无图片",
    featured: isEn ? "Featured" : "推荐",
    viewDetail: isEn ? "View Details" : "查看详情",
  };

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center">
        <p className="text-slate-500">{L.empty}</p>
        <p className="mt-2 text-sm text-slate-400">{L.emptySub}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const pt = Object.fromEntries(p.translations.map((tr) => [tr.locale, tr]));
        const bt = Object.fromEntries(
          p.productLine.brand.translations.map((tr) => [tr.locale, tr])
        );
        return (
          <Link
            key={p.id}
            href={`/products/${encodeURIComponent(p.model)}`}
            className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-sky-300 hover:shadow-md"
          >
            <div className="relative">
              {p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.coverImage}
                  alt={pt[locale]?.name ?? pt["zh"]?.name ?? p.model}
                  className="h-40 w-full bg-white object-contain"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-slate-50 text-slate-300">
                  {L.noImage}
                </div>
              )}
              {p.isFeatured && (
                <span className="absolute left-2 top-2 rounded bg-rose-500 px-1.5 py-0.5 text-xs font-medium text-white">
                  {L.featured}
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="font-mono text-base font-bold text-slate-900">{p.model}</div>
              <div className="mt-0.5 text-sm text-slate-600">
                {pt[locale]?.name ?? pt["zh"]?.name}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {bt[locale]?.name ?? bt["zh"]?.name ?? ""} · {p.productLine.code}
              </div>
              <div className="mt-3 text-sm font-medium text-sky-600 group-hover:text-sky-700">
                {L.viewDetail} →
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
