"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

type Series = { id: string; code: string; name: string; brandCode: string; brandName: string; count: number };
type CategoryNode = {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  series: Series[];
  children: CategoryNode[];
};

export default function ProductFilters({
  locale,
  categories,
  currentCategory,
  brands,
  currentBrand,
  currentQ,
  currentLine,
}: {
  locale: string;
  categories: CategoryNode[];
  currentCategory?: string;
  brands: { id: string; code: string; name: string }[];
  currentBrand?: string;
  currentQ: string;
  currentLine?: string;
}) {
  const router = useRouter();
  const [tempQ, setTempQ] = useState(currentQ);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const isEn = locale === "en";

  const topCategories = categories.filter((c) => !c.parentId);

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

  function toggleExpand(id: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // 渲染分类节点（含系列，默认折叠）
  function renderCat(c: CategoryNode, depth: number) {
    const hasSeries = c.series.length > 0;
    const hasChildren = c.children.length > 0;
    const isExpanded = expandedCats.has(c.id);
    const active = currentCategory === c.code;
    return (
      <div key={c.id}>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => toggleExpand(c.id)}
            disabled={!hasSeries && !hasChildren}
            className={`w-4 shrink-0 text-xs text-slate-400 ${hasSeries || hasChildren ? "cursor-pointer hover:text-sky-600" : "cursor-default"}`}
          >
            {hasSeries || hasChildren ? (isExpanded ? "▾" : "▸") : ""}
          </button>
          <a
            href={`/${locale}/products?category=${c.code}`}
            className={`block flex-1 rounded px-1 py-1.5 text-sm ${
              active ? "bg-sky-50 font-medium text-sky-700" : "text-slate-700 hover:bg-slate-50"
            }`}
            style={{ marginLeft: depth * 8 }}
          >
            {c.name}
          </a>
        </div>
        {isExpanded && (
          <div className="ml-3 border-l border-slate-100 pl-2">
            {c.series.length > 0 && (
              <div className="space-y-0.5">
                <a
                  href={buildUrl({ line: undefined })}
                  className={`block rounded px-2 py-1 text-xs ${
                    !currentLine ? "bg-sky-50 font-medium text-sky-700" : "text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {isEn ? "All Series" : "全部系列"}
                </a>
                {c.series.map((s) => (
                  <a
                    key={s.id}
                    href={buildUrl({ line: s.id })}
                    className={`block rounded px-2 py-1 text-xs ${
                      currentLine === s.id
                        ? "bg-sky-50 font-medium text-sky-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s.name}
                    <span className="ml-1 text-[10px] text-slate-400">({s.count})</span>
                  </a>
                ))}
              </div>
            )}
            {c.children.map((ch) => renderCat(ch, depth + 1))}
          </div>
        )}
      </div>
    );
  }

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
          {topCategories.map((c) => renderCat(c, 0))}
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
