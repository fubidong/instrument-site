"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

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

const STORAGE_KEY = "cmp_selected";

export default function ProductGrid({
  products,
}: {
  products: ProductCard[];
}) {
  const locale = useLocale();
  const isEn = locale === "en";
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSelected(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const L = {
    empty: isEn ? "No matching products found" : "没有找到符合条件的产品",
    emptySub: isEn ? "Please adjust your filters and try again" : "请调整筛选条件后重试",
    noImage: isEn ? "No image" : "暂无图片",
    featured: isEn ? "Featured" : "推荐",
    viewDetail: isEn ? "View Details" : "查看详情",
    compare: isEn ? "Compare" : "对比",
    compared: isEn ? "Added" : "已选",
    toCompare: isEn ? "Compare" : "去对比",
    clear: isEn ? "Clear" : "清空",
  };

  function toggle(id: string) {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function clearAll() {
    setSelected([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center">
        <p className="text-slate-500">{L.empty}</p>
        <p className="mt-2 text-sm text-slate-400">{L.emptySub}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const pt = Object.fromEntries(p.translations.map((tr) => [tr.locale, tr]));
          const bt = Object.fromEntries(
            p.productLine.brand.translations.map((tr) => [tr.locale, tr])
          );
          const isSelected = selected.includes(p.id);
          return (
            <div
              key={p.id}
              className={`group relative overflow-hidden rounded-lg border bg-white transition hover:shadow-md ${
                isSelected ? "border-sky-400 ring-2 ring-sky-200" : "border-slate-200 hover:border-sky-300"
              }`}
            >
              <Link
                href={`/products/${encodeURIComponent(p.model)}`}
                className="block"
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
              {/* 对比勾选 */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle(p.id);
                }}
                aria-pressed={isSelected}
                className={`absolute right-2 top-2 flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition ${
                  isSelected
                    ? "border-sky-500 bg-sky-500 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:text-sky-600"
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${
                    isSelected ? "border-white bg-white/20" : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <span className="text-[9px] leading-none">✓</span>}
                </span>
                {isSelected ? L.compared : L.compare}
              </button>
            </div>
          );
        })}
      </div>

      {/* 底部浮动对比栏 */}
      {selected.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-lg">
          <span className="text-sm text-slate-600">
            {isEn ? "Selected" : "已选"} {selected.length}
          </span>
          <Link
            href={`/compare?ids=${selected.join(",")}`}
            className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-500"
          >
            {L.toCompare}
          </Link>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            {L.clear}
          </button>
        </div>
      )}
    </>
  );
}
