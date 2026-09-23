import { cache } from "react";
import { db } from "./db";

/** 品牌分类统计：每分类的产品数 + 系列列表（含子分类递归汇总） */
export const getBrandCategoryStats = cache(async (brandId: string, locale: string = "zh") => {
  const cats = await db.category.findMany({ where: { brandId } });
  const catById = new Map(cats.map((c) => [c.id, c]));
  const childrenOf = (id: string) => cats.filter((c) => c.parentId === id);

  // 每个分类自身的产品数 + 系列
  const lines = await db.productLine.findMany({
    where: { brandId, isActive: true },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
      translations: { where: { locale } },
    },
  }) as any[];
  const ownModels: Record<string, number> = {};
  const ownSeries: Record<string, { name: string; code: string; models: number }[]> = {};
  for (const l of lines) {
    ownModels[l.categoryId] = (ownModels[l.categoryId] ?? 0) + l._count.products;
    if (l._count.products > 0) {
      const name = l.translations?.[0]?.name ?? l.code;
      (ownSeries[l.categoryId] ??= []).push({ name, code: l.code, models: l._count.products });
    }
  }

  // 递归汇总：分类的总数 = 自身 + 所有后代
  function aggregate(id: string): { models: number; series: { name: string; code: string; models: number }[] } {
    let models = ownModels[id] ?? 0;
    const series = [...(ownSeries[id] ?? [])];
    for (const child of childrenOf(id)) {
      const sub = aggregate(child.id);
      models += sub.models;
      series.push(...sub.series);
    }
    return { models, series };
  }

  const map: Record<string, { models: number; series: { name: string; code: string; models: number }[] }> = {};
  for (const c of cats) {
    map[c.id] = aggregate(c.id);
  }
  return map;
});
