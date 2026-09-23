import { cache } from "react";
import { db } from "./db";
import { t } from "./site";

/** 品牌信息 */
export const getBrand = cache(async (code: string) => {
  const brand = await db.brand.findFirst({
    where: { code: { equals: code.toLowerCase(), mode: "insensitive" } },
    include: { translations: true },
  });
  if (!brand) return null;
  const bt = Object.fromEntries(brand.translations.map((tr) => [tr.locale, tr]));
  return {
    id: brand.id,
    code: brand.code,
    name: bt,
    logo: brand.logo,
    website: brand.website,
    isActive: brand.isActive,
  };
});

/** 品牌分类树（含参数） */
export const getBrandCategories = cache(async (brandId: string, locale: string) => {
  const cats = await db.category.findMany({
    where: { brandId },
    include: {
      translations: true,
      paramGroups: { include: { translations: true, paramDefs: { include: { translations: true } } }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });
  return cats.map((c) => ({
    id: c.id,
    code: c.code,
    parentId: c.parentId,
    siteCategoryId: c.siteCategoryId,
    icon: c.icon,
    showInNav: c.showInNav,
    name: t(c.translations, locale, "name") || t(c.translations, "zh", "name") || c.code,
    enName: t(c.translations, "en", "name") || c.code,
    zhName: t(c.translations, "zh", "name") || c.code,
    paramGroups: c.paramGroups.map((g) => ({
      id: g.id,
      code: g.code,
      name: t(g.translations, locale, "name") || t(g.translations, "zh", "name") || g.code,
      params: g.paramDefs.map((d) => ({
        id: d.id,
        key: d.key,
        type: d.type,
        unit: d.unit,
        options: d.options ? JSON.parse(d.options) : undefined,
        name: t(d.translations, locale, "name") || t(d.translations, "zh", "name") || d.key,
      })),
    })),
  }));
});

/** 品牌分类下系列（含型号计数） */
export const getBrandSeries = cache(async (brandId: string, categoryId: string) => {
  const lines = await db.productLine.findMany({
    where: { brandId, categoryId, isActive: true },
    include: {
      translations: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { sortOrder: "asc" },
  });
  return lines.map((l) => ({
    id: l.id,
    code: l.code,
    name: t(l.translations, "zh", "name") || l.code,
    count: l._count.products,
  }));
});

/** 品牌分类下型号（含参数高亮） */
export const getBrandCategoryModels = cache(async (brandId: string, categoryId: string) => {
  const products = await db.product.findMany({
    where: { brandId, categoryId, isActive: true },
    include: {
      translations: true,
      productLine: { include: { translations: true } },
      paramValues: { include: { paramDefinition: { include: { translations: true } } } },
    },
    orderBy: [{ sortOrder: "asc" }, { model: "asc" }],
  });
  return products.map((p) => ({
    id: p.id,
    model: p.model,
    coverImage: p.coverImage,
    series: p.productLine.code,
    seriesName: t(p.productLine.translations, "zh", "name") || p.productLine.code,
    name: t(p.translations, "zh", "name") || p.model,
    highlights: p.paramValues
      .filter((pv) => pv.isHighlight)
      .slice(0, 2)
      .map((pv) => {
        const name = t(pv.paramDefinition.translations, "zh", "name") || pv.paramDefinition.key;
        const val = pv.valueString ?? (pv.valueBoolean ? "是" : "否");
        return `${name}: ${val}`;
      }),
  }));
});

/** 型号详情 */
export const getBrandModel = cache(async (brandId: string, model: string) => {
  const product = await db.product.findUnique({
    where: { model },
    include: {
      translations: true,
      productLine: { include: { translations: true } },
      category: { include: { translations: true } },
      paramValues: { include: { paramDefinition: { include: { translations: true } } } },
      images: true,
    },
  });
  if (!product || product.brandId !== brandId) return null;
  const pt = Object.fromEntries(product.translations.map((tr) => [tr.locale, tr]));
  return {
    id: product.id,
    model: product.model,
    coverImage: product.coverImage,
    seriesId: product.productLineId,
    series: product.productLine.code,
    seriesName: t(product.productLine.translations, "zh", "name") || product.productLine.code,
    categoryId: product.categoryId,
    categoryName: t(product.category.translations, "zh", "name") || product.category.code,
    zh: pt["zh"] ?? null,
    en: pt["en"] ?? null,
    paramValues: product.paramValues,
    images: product.images,
  };
});
