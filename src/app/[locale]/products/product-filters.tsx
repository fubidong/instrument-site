"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

export default function ProductFilters({
  locale,
  categories,
  currentCategory,
  brands,
  currentBrand,
  currentQ,
  currentLine,
  lines,
}: {
  locale: string;
  categories: { id: string; code: string; name: string; parentId: string | null }[];
  currentCategory?: string;
  brands: { id: string; code: string; name: string }[];
  currentBrand?: string;
  currentQ: string;
  currentLine?: string;
  lines: { id: string; code: string; name: string; brandCode: string; brandName: string; count: number }[];
}) {
  const router = useRouter();
  const [tempQ, setTempQ] = useState(currentQ);
  const isEn = locale === "en";

  const topCategories = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { category: currentCategory, brand: currentBrand, line: currentLine, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return `/products${params.toString() ? `?${params.toString()}` : ""}`;
  }

  function search() {
    const params = new URLSearchParams();
    if (currentCategory) params.set("category", currentCategory);
    if (currentBrand) params.set("brand", currentBrand);
    if (currentLine) params.set("line", currentLine);
    if (tempQ.trim()) params.set("q", tempQ.trim());
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const labels = {
    allProducts: isEn ? "All Products" : "全部产品",
    category: isEn ? "Category" : "品类",
    brand: isEn ? "Brand" : "品牌",
    series: isEn ? "Series" : "系列",
    allBrands: isEn ? "All Brands" : "全部品牌",
    search: isEn ? "Search model/name..." : "搜索型号/名称...",
  };

  // 系列按品牌分组
  const groupLines = () => {
    const m = new Map<string, typeof lines>();
    for (const ln of lines) {
      const arr = m.get(ln.brandName) ?? [];
      arr.push(ln);
      m.set(ln.brandName, arr);
    }
    return [...m.entries()];
  };

  return (
    <aside className="w-full shrink-0 space-y-4 lg:w-64">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">{labels.category}</div>
        <div className="space-y-1">
          <a
            href={`/${locale}/products`}
            className={`block rounded px-3 py-1.5 text-sm ${
              !currentCategory ? "bg-sky-50 font-medium text-sky-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {labels.allProducts}
          </a>
          {topCategories.map((c) => {
            const subs = childrenOf(c.id);
            const active = currentCategory === c.code;
            return (
              <div key={c.id}>
                <a
                  href={`/${locale}/products?category=${c.code}`}
                  className={`block rounded px-3 py-1.5 text-sm ${
                    active ? "bg-sky-50 font-medium text-sky-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {c.name}
                </a>
                {subs.length > 0 && (
                  <div className="ml-3 border-l border-slate-100 pl-2">
                    {subs.map((s) => (
                      <a
                        key={s.id}
                        href={`/${locale}/products?category=${s.code}`}
                        className={`block rounded px-3 py-1 text-xs ${
                          currentCategory === s.code
                            ? "bg-sky-50 font-medium text-sky-700"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {s.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 品牌 */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">{labels.brand}</div>
        <div className="space-y-1">
          <a
            href={buildUrl({ brand: undefined })}
            className={`block rounded px-3 py-1.5 text-sm ${
              !currentBrand ? "bg-sky-50 font-medium text-sky-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {labels.allBrands}
          </a>
          {brands.map((b) => (
            <a
              key={b.id}
              href={buildUrl({ brand: b.id })}
              className={`block rounded px-3 py-1.5 text-sm ${
                currentBrand === b.id
                  ? "bg-sky-50 font-medium text-sky-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {b.name}
            </a>
          ))}
        </div>
      </div>

      {/* 系列筛选（按品牌分组） */}
      {lines.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-slate-800">{labels.series}</div>
          <div className="space-y-2">
            {groupLines().map(([bn, items]) => (
              <div key={bn}>
                <div className="mb-1 text-xs font-semibold text-slate-400">{bn}</div>
                <div className="space-y-0.5">
                  <a
                    href={buildUrl({ line: undefined })}
                    className={`block rounded px-3 py-1 text-xs ${
                      !currentLine
                        ? "bg-sky-50 font-medium text-sky-700"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {isEn ? "All Series" : "全部系列"}
                  </a>
                  {items.map((ln) => (
                    <a
                      key={ln.id}
                      href={buildUrl({ line: ln.id })}
                      className={`block rounded px-3 py-1 text-xs ${
                        currentLine === ln.id
                          ? "bg-sky-50 font-medium text-sky-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {ln.name}
                      <span className="ml-1 text-[10px] text-slate-400">({ln.count})</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 搜索 */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <input
          value={tempQ}
          onChange={(e) => setTempQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
          placeholder={labels.search}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
      </div>
    </aside>
  );
}
