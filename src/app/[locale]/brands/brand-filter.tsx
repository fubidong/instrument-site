"use client";

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
 * 品牌页左侧品类筛选：胶囊流式布局
 * 顶级品类为胶囊，选中后下方展开该品类的子品类/系列胶囊，点击系列筛选产品
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
    series: isEn ? "Series" : "系列",
    subCats: isEn ? "Subcategories" : "子分类",
  };

  function findNode(nodes: BrandCatNode[], code: string): BrandCatNode | null {
    for (const n of nodes) {
      if (n.code === code) return n;
      const found = findNode(n.children, code);
      if (found) return found;
    }
    return null;
  }

  const current = currentCategory ? findNode(categories, currentCategory) : undefined;

  // 顶级品类是否激活：当前选中品类位于该顶级子树内
  function topActive(c: BrandCatNode) {
    if (!currentCategory) return false;
    if (c.code === currentCategory) return true;
    return findNode(c.children, currentCategory) !== null;
  }

  function catHref(code: string) {
    // 切换品类时清除参数筛选（旧参数不适用）
    return `${basePath}?category=${code}`;
  }

  function lineHref(catCode: string, lineId: string) {
    return `${basePath}?category=${catCode}&line=${lineId}`;
  }

  const chipBase =
    "rounded-full border px-3 py-1 text-[13px] leading-5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1";
  const chipIdle =
    "border-[var(--ui-line)] bg-white text-[var(--ui-mute)] hover:border-[var(--primary)] hover:text-[var(--primary)]";
  const chipActive = "border-[var(--primary)] bg-[var(--primary)] text-white";

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="ui-card p-4">
        <div className="mb-3 text-sm font-semibold text-[var(--ui-ink)]">{L.categories}</div>

        {/* 顶级品类胶囊 */}
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={`${basePath}`}
            className={`${chipBase} ${
              !currentCategory ? chipActive : chipIdle
            }`}
          >
            {L.allProducts}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={catHref(c.code)}
              className={`${chipBase} ${topActive(c) ? chipActive : chipIdle}`}
            >
              {c.name}
              <span className="ml-1 opacity-70">({c.count})</span>
            </Link>
          ))}
        </div>

        {/* 选中品类的子分类胶囊 */}
        {current && current.children.length > 0 && (
          <div className="mt-3 border-t border-[var(--ui-line)] pt-3">
            <div className="mb-1.5 text-xs text-[var(--ui-mute)]">{L.subCats}</div>
            <div className="flex flex-wrap gap-1.5">
              {current.children.map((ch) => (
                <Link
                  key={ch.id}
                  href={catHref(ch.code)}
                  className={`${chipBase} ${
                    currentCategory === ch.code ? chipActive : chipIdle
                  }`}
                >
                  {ch.name}
                  <span className="ml-1 opacity-70">({ch.count})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 选中品类的系列胶囊 */}
        {current && current.series.length > 0 && (
          <div className="mt-3 border-t border-[var(--ui-line)] pt-3">
            <div className="mb-1.5 text-xs text-[var(--ui-mute)]">{L.series}</div>
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={`${basePath}?category=${current.code}`}
                className={`${chipBase} ${
                  !currentLine ? chipActive : chipIdle
                }`}
              >
                {L.allSeries}
              </Link>
              {current.series.map((s) => (
                <Link
                  key={s.id}
                  href={lineHref(current.code, s.id)}
                  className={`${chipBase} ${
                    currentLine === s.id ? chipActive : chipIdle
                  }`}
                >
                  {s.name}
                  <span className="ml-1 opacity-70">({s.count})</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
