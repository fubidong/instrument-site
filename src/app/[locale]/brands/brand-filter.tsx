"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

type SeriesItem = { id: string; code: string; name: string; count: number };
export type BrandCatNode = {
  id: string;
  code: string;
  name: string;
  count: number;
  parentId: string | null;
  series: SeriesItem[];
  children: BrandCatNode[];
};

/**
 * 品牌页左侧品类树：品类 → 系列 联动折叠展示
 * 默认全部折叠，点击箭头展开显示子品类/系列，点击系列筛选产品
 */
export default function BrandCategoryTree({
  categories,
  currentCategory,
  currentLine,
  basePath,
  isEn,
}: {
  categories: BrandCatNode[];
  currentCategory?: string;
  currentLine?: string;
  basePath: string;
  isEn: boolean;
}) {
  const L = {
    categories: isEn ? "Categories" : "产品品类",
    allSeries: isEn ? "All Series" : "全部系列",
    allProducts: isEn ? "All Products" : "全部产品",
  };

  // 找到当前品类的祖先链（用于初始展开）
  function findPath(nodes: BrandCatNode[], code: string, path: string[] = []): string[] | null {
    for (const n of nodes) {
      const np = [...path, n.id];
      if (n.code === code) return np;
      const found = findPath(n.children, code, np);
      if (found) return found;
    }
    return null;
  }
  const initialExpanded = (() => {
    if (!currentCategory) return new Set<string>();
    const path = findPath(categories, currentCategory);
    return new Set((path ?? []).slice(0, -1)); // 展开祖先（不含自身），默认折叠
  })();
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function catHref(code: string) {
    // 切换品类时清除参数筛选（旧参数不适用）
    return `${basePath}?category=${code}`;
  }

  function lineHref(catCode: string, lineId: string) {
    return `${basePath}?category=${catCode}&line=${lineId}`;
  }

  function renderNode(c: BrandCatNode, depth: number) {
    const isExpanded = expanded.has(c.id);
    const active = currentCategory === c.code;
    return (
      <div key={c.id}>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => toggleExpand(c.id)}
            disabled={c.series.length === 0 && c.children.length === 0}
            className={`w-4 shrink-0 text-xs text-slate-400 ${
              c.series.length > 0 || c.children.length > 0
                ? "cursor-pointer hover:text-sky-600"
                : "cursor-default"
            }`}
          >
            {c.series.length > 0 || c.children.length > 0 ? (isExpanded ? "▾" : "▸") : ""}
          </button>
          <Link
            href={catHref(c.code)}
            className={`block flex-1 rounded px-1 py-1.5 text-sm ${
              active ? "bg-sky-50 font-medium text-sky-700" : "text-slate-700 hover:bg-slate-50"
            }`}
            style={{ marginLeft: depth * 8 }}
          >
            {c.name}
            <span className="ml-1 text-[10px] text-slate-400">({c.count})</span>
          </Link>
        </div>
        {isExpanded && (
          <div className="ml-3 border-l border-slate-100 pl-2">
            {c.series.length > 0 && (
              <div className="space-y-0.5">
                {c.series.map((s) => (
                  <Link
                    key={s.id}
                    href={lineHref(c.code, s.id)}
                    className={`block rounded px-2 py-1 text-xs ${
                      currentLine === s.id
                        ? "bg-sky-50 font-medium text-sky-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s.name}
                    <span className="ml-1 text-[10px] text-slate-400">({s.count})</span>
                  </Link>
                ))}
              </div>
            )}
            {c.children.map((ch) => renderNode(ch, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">{L.categories}</div>
        <div className="space-y-1">
          <Link
            href={`${basePath}`}
            className={`block rounded px-3 py-1.5 text-sm ${
              !currentCategory ? "bg-sky-50 font-medium text-sky-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {L.allProducts}
          </Link>
          {categories.map((c) => renderNode(c, 0))}
        </div>
      </div>
    </aside>
  );
}
