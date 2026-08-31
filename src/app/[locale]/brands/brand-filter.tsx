"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import ProductGrid from "@/app/[locale]/products/product-grid";

type Cat = {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  icon?: string | null;
  count: number;
  series: { id: string; code: string; name: string; count: number }[];
};

type Prod = {
  id: string;
  model: string;
  coverImage: string | null;
  isFeatured: boolean;
  categoryId: string;
  productLineId: string;
  productLine: {
    code: string;
    translations: { locale: string; name: string }[];
    brand: { translations: { locale: string; name: string }[] };
  };
  translations: { locale: string; name: string }[];
};

export default function BrandFilterExplorer({
  categories,
  products,
}: {
  categories: Cat[];
  products: Prod[];
}) {
  const locale = useLocale();
  const isEn = locale === "en";
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeLine, setActiveLine] = useState<string | null>(null);

  const topCats = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  const currentTop = topCats.find((c) => c.id === activeCat) ?? topCats[0];
  const shownCats = currentTop ? [currentTop, ...childrenOf(currentTop.id)] : topCats;

  // 当前品类范围（含子类）
  const catScope = useMemo(() => {
    if (!currentTop) return new Set<string>();
    const set = new Set<string>([currentTop.id]);
    childrenOf(currentTop.id).forEach((c) => set.add(c.id));
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTop?.id, categories]);

  // 当前品类下的系列
  const linesInCat = useMemo(() => {
    if (!currentTop) return [];
    const all = categories.flatMap((c) => c.series);
    return all.filter((s) => catScope.has(currentTop.id)); // series 的品类归属由父级确定
  }, [currentTop, categories, catScope]);

  // 实际上 series 需关联到品类：用 Cat.series 分组
  const seriesGrouped = useMemo(() => {
    if (!currentTop) return [];
    const own = currentTop.series.map((s) => ({ ...s, catId: currentTop.id }));
    const subs = childrenOf(currentTop.id).flatMap((c) => c.series.map((s) => ({ ...s, catId: c.id })));
    return [...own, ...subs];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTop, categories]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (currentTop) list = list.filter((p) => catScope.has(p.categoryId));
    if (activeLine) list = list.filter((p) => p.productLineId === activeLine);
    return list;
  }, [products, currentTop, catScope, activeLine]);

  const L = {
    categories: isEn ? "Categories" : "品类",
    series: isEn ? "Series" : "系列",
    allSeries: isEn ? "All Series" : "全部系列",
    products: isEn ? "Products" : "产品",
    total: isEn ? "Total" : "共",
    models: isEn ? "Models" : "型号",
  };

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* 左：品类 */}
      <aside className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-1">
        <div className="mb-3 text-sm font-semibold text-slate-800">{L.categories}</div>
        <div className="space-y-1">
          {topCats.map((c) => (
            <div key={c.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveCat(c.id);
                  setActiveLine(null);
                }}
                className={`block w-full rounded px-3 py-1.5 text-left text-sm ${
                  activeCat === c.id || (activeCat === null && c.id === topCats[0]?.id)
                    ? "bg-sky-50 font-medium text-sky-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">{c.icon ?? ""} </span>
                {c.name}
                <span className="ml-1 text-[10px] text-slate-400">({c.count})</span>
              </button>
              {activeCat === c.id && childrenOf(c.id).length > 0 && (
                <div className="ml-3 border-l border-slate-100 pl-2">
                  {childrenOf(c.id).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setActiveCat(s.id);
                        setActiveLine(null);
                      }}
                      className="block w-full rounded px-3 py-1 text-left text-xs text-slate-500 hover:bg-slate-50"
                    >
                      {s.name}
                      <span className="ml-1 text-[10px] text-slate-400">({s.count})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* 中：系列 */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-1">
        <div className="mb-3 text-sm font-semibold text-slate-800">
          {L.series}
          {currentTop && <span className="ml-1 font-normal text-slate-400">({currentTop.name})</span>}
        </div>
        {seriesGrouped.length === 0 ? (
          <p className="text-sm text-slate-400">{isEn ? "No series" : "暂无系列"}</p>
        ) : (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveLine(null)}
              className={`block w-full rounded px-3 py-1.5 text-left text-sm ${
                !activeLine ? "bg-sky-50 font-medium text-sky-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {L.allSeries}
            </button>
            {seriesGrouped.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveLine(s.id)}
                className={`block w-full rounded px-3 py-1.5 text-left text-sm ${
                  activeLine === s.id ? "bg-sky-50 font-medium text-sky-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s.name}
                <span className="ml-1 text-[10px] text-slate-400">({s.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 右：产品 */}
      <div className="lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            {L.products}
            <span className="ml-2 text-xs font-normal text-slate-400">
              {L.total} {filteredProducts.length} {L.models}
            </span>
          </h3>
        </div>
        <ProductGrid products={filteredProducts as any} />
      </div>
    </div>
  );
}
