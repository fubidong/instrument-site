"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type SeriesItem = { name: string; code: string; models: number };
type SeriesCat = { id: string; code: string; name: string; enName: string; icon: string | null };
type CatStats = Record<string, { models: number; series: SeriesItem[] }>;

const slugOf = (code: string) => code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function SeriesExplorer({
  cats,
  stats,
  base,
  isEn,
}: {
  cats: SeriesCat[];
  stats: CatStats;
  base: string;
  isEn: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabs = useMemo(
    () => [
      { id: "all", slug: "all", name: isEn ? "All" : "全部", icon: null as string | null },
      ...cats.map((c) => ({ id: c.id, slug: slugOf(c.code), name: c.name, icon: c.icon })),
    ],
    [cats, isEn]
  );

  const activeSlug = searchParams.get("category") ?? "all";
  const activeTab = tabs.find((t) => t.slug === activeSlug) ?? tabs[0];

  // 当前显示分组：全部 → 所有品类；否则仅选中品类
  const groups = useMemo(() => {
    if (activeTab.slug === "all") {
      return cats
        .map((c) => ({ cat: c, series: stats[c.id]?.series ?? [] }))
        .filter((g) => g.series.length > 0);
    }
    const c = cats.find((x) => x.id === activeTab.id);
    if (!c) return [];
    return [{ cat: c, series: stats[c.id]?.series ?? [] }];
  }, [activeTab, cats, stats]);

  function setCat(slug: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (slug === "all") sp.delete("category");
    else sp.set("category", slug);
    router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
  }

  const totalSeries = cats.reduce((n, c) => n + (stats[c.id]?.series.length ?? 0), 0);
  const catName = (c: SeriesCat) => (isEn ? c.enName || c.name : c.name);

  return (
    <div>
      {/* 横向品类导航 */}
      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map((t) => {
          const active = t.slug === activeTab.slug;
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => setCat(t.slug)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${
                active
                  ? "border-sky-600 bg-sky-600 text-white shadow"
                  : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600"
              }`}
            >
              {t.icon && <span>{t.icon}</span>}
              {t.name}
            </button>
          );
        })}
      </div>

      {/* 切换动画区 */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab.slug}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="mt-6"
        >
          {groups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
              {isEn ? "No series under this category yet." : "该分类下暂无系列产品"}
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map((g) => (
                <div key={g.cat.id}>
                  {activeTab.slug === "all" && (
                    <div className="mb-3 flex items-center gap-2">
                      {g.cat.icon && <span className="text-lg">{g.cat.icon}</span>}
                      <span className="text-sm font-bold text-slate-800">{catName(g.cat)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
                        {g.series.length} {isEn ? "series" : "个系列"}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {g.series.map((s) => (
                      <Link
                        key={`${g.cat.id}-${s.code}`}
                        href={`${base}/category/${slugOf(g.cat.code)}/${encodeURIComponent(s.code)}`}
                        className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-md"
                      >
                        <span className="truncate font-medium text-slate-800 group-hover:text-sky-700">
                          {s.name}
                        </span>
                        <span className="ml-2 shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                          {s.models} {isEn ? "models" : "型号"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center text-xs text-slate-400">
        {isEn
          ? `${totalSeries} product series in total, grouped by category.`
          : `共 ${totalSeries} 个产品系列，按品类分组。`}
      </p>
    </div>
  );
}

export default function BrandSeriesExplorer(props: {
  cats: SeriesCat[];
  stats: CatStats;
  base: string;
  isEn: boolean;
}) {
  return <SeriesExplorer {...props} />;
}
