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
  const isEn = locale === "en";

  const topCategories = categories.filter((c) => !c.parentId);
  // 品类-品牌关联：找到当前选中品类节点（顶层或子分类）
  const currentCatNode =
    categories.find((c) => c.code === currentCategory) ??
    categories.flatMap((c) => c.children).find((c) => c.code === currentCategory);
  // 收集当前品类下实际有产品的品牌 code 集合（顶层含子分类系列，子分类用自身系列）
  const brandCodesInCat = new Set(
    currentCatNode
      ? currentCatNode.parentId
        ? currentCatNode.series.map((s) => s.brandCode)
        : [
            ...currentCatNode.series.map((s) => s.brandCode),
            ...currentCatNode.children.flatMap((ch) => ch.series.map((s) => s.brandCode)),
          ]
      : []
  );
  // 品牌胶囊：选中品类时只显示该品类下实际有产品的品牌；未选中品类显示全部
  const visibleBrands = currentCatNode
    ? brands.filter((b) => brandCodesInCat.has(b.code))
    : brands;
  // 选中品牌的 code（用于系列胶囊过滤）
  const currentBrandCode = brands.find((b) => b.id === currentBrand)?.code;
  // 系列胶囊：选中品牌时只显示该品牌在该品类下的系列；未选品牌显示全部系列
  const seriesInScope =
    currentCatNode && currentBrandCode
      ? currentCatNode.parentId
        ? currentCatNode.series.filter((s) => s.brandCode === currentBrandCode)
        : [
            ...currentCatNode.series.filter((s) => s.brandCode === currentBrandCode),
            ...currentCatNode.children.flatMap((ch) =>
              ch.series.filter((s) => s.brandCode === currentBrandCode)
            ),
          ]
      : currentCatNode
        ? currentCatNode.parentId
          ? currentCatNode.series
          : [
              ...currentCatNode.series,
              ...currentCatNode.children.flatMap((ch) => ch.series),
            ]
        : [];

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { category: currentCategory, brand: currentBrand, line: currentLine, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return `/${locale}/products${params.toString() ? `?${params.toString()}` : ""}`;
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
    subCats: isEn ? "Subcategories" : "子分类",
    allBrands: isEn ? "All Brands" : "全部品牌",
    search: isEn ? "Search model/name..." : "搜索型号/名称...",
  };

  // 在品类树中查找当前选中节点（顶级或子级）
  function findNode(nodes: CategoryNode[], code: string): CategoryNode | null {
    for (const n of nodes) {
      if (n.code === code) return n;
      const found = findNode(n.children, code);
      if (found) return found;
    }
    return null;
  }
  const current = currentCategory ? findNode(topCategories, currentCategory) : undefined;

  // 顶级品类胶囊激活态：当前选中位于该顶级子树内
  function topActive(c: CategoryNode) {
    if (!currentCategory) return false;
    if (c.code === currentCategory) return true;
    return findNode(c.children, currentCategory) !== null;
  }

  const chipBase = "rounded-full border px-3 py-1 text-[13px] leading-5 transition-colors";
  const chipIdle = "border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary";
  const chipActive = "border-primary bg-primary text-white";

  return (
    <aside className="w-full shrink-0 space-y-4 lg:w-72">
      {/* 搜索（置于品类上方，支持型号/名称） */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <input
          value={tempQ}
          onChange={(e) => setTempQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
          placeholder={labels.search}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">{labels.category}</div>

        {/* 顶级品类胶囊 */}
        <div className="flex flex-wrap gap-1.5">
          <a
            href={buildUrl({ category: undefined, brand: undefined, line: undefined })}
            className={`${chipBase} ${!currentCategory ? chipActive : chipIdle}`}
          >
            {labels.allProducts}
          </a>
          {topCategories.map((c) => (
            <a
              key={c.id}
              href={buildUrl({ category: c.code, brand: undefined, line: undefined })}
              className={`${chipBase} ${topActive(c) ? chipActive : chipIdle}`}
            >
              {c.name}
            </a>
          ))}
        </div>

        {/* 选中品类的子分类胶囊 */}
        {current && current.children.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="mb-1.5 text-xs text-slate-400">{labels.subCats}</div>
            <div className="flex flex-wrap gap-1.5">
              {current.children.map((ch) => (
                <a
                  key={ch.id}
                  href={buildUrl({ category: ch.code, brand: undefined, line: undefined })}
                  className={`${chipBase} ${
                    currentCategory === ch.code ? chipActive : chipIdle
                  }`}
                >
                  {ch.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 品牌（胶囊流式布局，位于系列之前） */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">{labels.brand}</div>
        <div className="flex flex-wrap gap-1.5">
          <a
            href={buildUrl({ brand: undefined })}
            className={`${chipBase} ${
              !currentBrand ? chipActive : chipIdle
            }`}
          >
            {labels.allBrands}
          </a>
          {visibleBrands.map((b) => (
            <a
              key={b.id}
              href={buildUrl({ brand: b.id, line: undefined })}
              className={`${chipBase} ${
                currentBrand === b.id ? chipActive : chipIdle
              }`}
            >
              {b.name}
            </a>
          ))}
        </div>
      </div>

      {/* 选中品类的系列胶囊（位于品牌之后，随品牌联动） */}
      {currentCatNode && seriesInScope.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-slate-800">{labels.series}</div>
          <div className="flex flex-wrap gap-1.5">
            <a
              href={buildUrl({ line: undefined })}
              className={`${chipBase} ${!currentLine ? chipActive : chipIdle}`}
            >
              {isEn ? "All Series" : "全部系列"}
            </a>
            {seriesInScope.map((s) => (
              <a
                key={s.id}
                href={buildUrl({ line: s.id })}
                className={`${chipBase} ${currentLine === s.id ? chipActive : chipIdle}`}
              >
                {s.name}
                <span className="ml-1 opacity-70">({s.count})</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
