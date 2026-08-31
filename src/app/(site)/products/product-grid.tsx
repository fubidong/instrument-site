import Link from "next/link";

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

export default function ProductGrid({ products }: { products: ProductCard[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center">
        <p className="text-slate-500">没有找到符合条件的产品</p>
        <p className="mt-2 text-sm text-slate-400">请调整筛选条件后重试</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const pt = Object.fromEntries(p.translations.map((tr) => [tr.locale, tr]));
        const bt = Object.fromEntries(p.productLine.brand.translations.map((tr) => [tr.locale, tr]));
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
                  alt={pt["zh"]?.name ?? p.model}
                  className="h-40 w-full object-contain bg-white"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-slate-50 text-slate-300">
                  暂无图片
                </div>
              )}
              {p.isFeatured && (
                <span className="absolute left-2 top-2 rounded bg-rose-500 px-1.5 py-0.5 text-xs font-medium text-white">
                  推荐
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="font-mono text-base font-bold text-slate-900">{p.model}</div>
              <div className="mt-0.5 text-sm text-slate-600">{pt["zh"]?.name}</div>
              <div className="mt-2 text-xs text-slate-400">
                {bt["zh"]?.name ?? ""} · {p.productLine.code}
              </div>
              <div className="mt-3 text-sm font-medium text-sky-600 group-hover:text-sky-700">
                查看详情 →
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
