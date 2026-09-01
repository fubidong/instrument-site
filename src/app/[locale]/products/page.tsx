import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import { parseFreqMHz, normParamValue, formatFreq } from "@/lib/param-alias";
import { routing } from "@/i18n/routing";
import ProductFilters from "./product-filters";
import ProductParamFilter from "./product-param-filter";
import ProductGrid from "./product-grid";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = { title: "产品中心 | 按参数选型" };

function parseParamFilters(searchParams: URLSearchParams, defs: any[]) {
  const filters: { def: any; defIds: string[]; type: string; min?: number; max?: number; values?: string[]; on?: boolean }[] = [];
  for (const def of defs) {
    if (!def.isFilterable) continue;
    const defIds = def.defIds ?? [def.id];
    const min = searchParams.get(`p_${def.key}_min`);
    const max = searchParams.get(`p_${def.key}_max`);
    const values = searchParams.get(`p_${def.key}`);
    const le = searchParams.get(`p_${def.key}_le`);
    if (def.type === "number" || def.type === "range") {
      if (min || max) {
        filters.push({
          def,
          defIds,
          type: def.type,
          min: min ? parseFloat(min) : undefined,
          max: max ? parseFloat(max) : undefined,
        });
      }
    } else if (def.type === "enum") {
      if (le) {
        filters.push({ def, defIds, type: "enum_le", max: parseFloat(le) });
      } else if (values) {
        filters.push({ def, defIds, type: "enum", values: values.split(",").filter(Boolean) });
      }
    } else if (def.type === "boolean") {
      const on = searchParams.get(`p_${def.key}`);
      if (on === "1" || on === "true") filters.push({ def, defIds, type: "boolean", on: true });
    }
  }
  return filters;
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const sp = await searchParams;
  const searchParamsObj = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => {
    if (v) searchParamsObj.set(k, v);
  });

  const categoryCode = sp.category;
  const brandId = sp.brand;
  const lineId = sp.line;
  const q = sp.q;

  const categories = await db.category.findMany({
    where: { brandId: null },
    include: { translations: true, children: { include: { translations: true } } },
    orderBy: { sortOrder: "asc" },
  });
  // 全站品类 → 对应品牌分类（用于聚合筛选）
  const siteCatToBrandCats = new Map<string, string[]>();
  const brandCats = await db.category.findMany({ where: { brandId: { not: null } }, select: { id: true, siteCategoryId: true } });
  for (const bc of brandCats) {
    if (!bc.siteCategoryId) continue;
    const arr = siteCatToBrandCats.get(bc.siteCategoryId) ?? [];
    arr.push(bc.id);
    siteCatToBrandCats.set(bc.siteCategoryId, arr);
  }
  const catMap = new Map(categories.map((c) => [c.code, c]));
  let currentCategory = categoryCode ? catMap.get(categoryCode) : undefined;
  let categoryIds: string[] = [];
  if (currentCategory) {
    // 综合站聚合：该全站品类 + 其子品类 + 对应品牌分类
    categoryIds = [currentCategory.id, ...currentCategory.children.map((c) => c.id)];
    const brandIdsForSite = categoryIds.flatMap((id) => siteCatToBrandCats.get(id) ?? []);
    categoryIds.push(...brandIdsForSite);
  }

  // 参数筛选：综合站用品牌分类的参数定义（产品参数挂在品牌定义上）
  // 选中全站品类 → 找对应品牌顶层分类 → 按 key 跨品牌聚合参数定义
  let filterDefs: any[] = [];
  if (currentCategory) {
    // 找到该全站品类对应的品牌顶层分类（siteCategoryId 指向该品类、且无 parent）
    const brandTopCats = brandCats.filter(
      (bc) => bc.siteCategoryId && categoryIds.includes(bc.siteCategoryId)
    );
    const allDefs = await db.paramDefinition.findMany({
      where: { categoryId: { in: brandTopCats.map((c) => c.id) }, isFilterable: true },
      include: { translations: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    // 按 key 聚合：每个 key 保留所有品牌的 def id（用于跨品牌筛选与档位聚合）
    const byKey = new Map<string, any[]>();
    for (const d of allDefs) {
      const arr = byKey.get(d.key) ?? [];
      arr.push(d);
      byKey.set(d.key, arr);
    }
    for (const [key, defs] of byKey) {
      filterDefs.push({ ...defs[0], defIds: defs.map((d: any) => d.id) });
    }
    // 聚合滑块/胶囊档位：从该 key 全部产品的实际参数值聚合（单值、规范格式、排除范围型）
    filterDefs = await Promise.all(
      filterDefs.map(async (fd: any) => {
        const rows = await db.productParamValue.findMany({
          where: { paramDefinitionId: { in: fd.defIds } },
          select: { valueString: true },
          distinct: ["valueString"],
        });
        const freqMap = new Map<number, string>();
        const otherMap = new Map<string, string>(); // 归一化键 → 最短原始值
        for (const r of rows) {
          if (!r.valueString) continue;
          const v = r.valueString.trim().replace(/[；;，,。、\u00A0]+$/g, "");
          if (!v) continue;
          if (/[~～\-–—]/.test(v)) continue; // 范围型（如频率范围）跳过
          const mhz = parseFreqMHz(v);
          if (mhz !== null) {
            if (!freqMap.has(mhz)) freqMap.set(mhz, formatFreq(mhz));
          } else {
            const norm = normParamValue(v);
            if (!norm) continue;
            const existing = otherMap.get(norm);
            if (!existing || v.length < existing.length) otherMap.set(norm, v);
          }
        }
        if (freqMap.size > 1) {
          // 滑块参数：数值升序
          const arr = [...freqMap.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, val]) => ({ value: val, label_zh: val, label_en: val }));
          return { ...fd, type: "enum", options: JSON.stringify(arr) };
        } else if (otherMap.size > 0) {
          // 普通枚举（胶囊点选）
          const arr = [...otherMap.entries()]
            .sort((a, b) => a[0].localeCompare(b[0], "zh"))
            .map(([, val]) => ({ value: val, label_zh: val, label_en: val }));
          return { ...fd, type: "enum", options: JSON.stringify(arr) };
        }
        // 无聚合结果：清空预置 options（避免 def.options 陈旧值污染筛选）
        return { ...fd, options: null };
      })
    );
  }

  const filters = parseParamFilters(searchParamsObj, filterDefs);

  const where: any = { isActive: true };
  if (categoryIds.length > 0) where.categoryId = { in: categoryIds };
  if (brandId) where.brandId = brandId;
  if (lineId) where.productLineId = lineId;
  if (q?.trim()) {
    where.OR = [
      { model: { contains: q.trim(), mode: "insensitive" } },
      { translations: { some: { name: { contains: q.trim(), mode: "insensitive" } } } },
    ];
  }

  let paramFilteredIds: string[] | null = null;
  if (filters.length > 0) {
    const productIdsByDef: Record<string, string[]> = {};
    for (const f of filters) {
      let wherePv: any = { paramDefinitionId: { in: f.defIds } };
      if (f.type === "number" || f.type === "range") {
        if (f.min !== undefined && f.max !== undefined) {
          wherePv = {
            ...wherePv,
            OR: [
              { valueNumber: { gte: f.min, lte: f.max } },
              { valueMin: { gte: f.min }, valueMax: { lte: f.max } },
            ],
          };
        } else if (f.min !== undefined) {
          wherePv = { ...wherePv, OR: [{ valueNumber: { gte: f.min } }, { valueMin: { gte: f.min } }] };
        } else if (f.max !== undefined) {
          wherePv = { ...wherePv, OR: [{ valueNumber: { lte: f.max } }, { valueMax: { lte: f.max } }] };
        }
      } else if (f.type === "enum") {
        // valueString 是 "A | B | C" 格式：归一化后精确匹配（任一命中即入选），跨品牌 defIds
        const all = await db.productParamValue.findMany({
          where: { paramDefinitionId: { in: f.defIds } },
          select: { productId: true, valueString: true },
        });
        const wanted = new Set((f.values ?? []).map(normParamValue));
        const matched = all
          .filter((row) => {
            if (!row.valueString) return false;
            const tokens = row.valueString.split("|").map((s) => normParamValue(s));
            return tokens.some((tok) => wanted.has(tok));
          })
          .map((r) => r.productId);
        productIdsByDef[f.def.id] = matched;
        continue;
      } else if (f.type === "enum_le") {
        // 兼容旧 URL（p_xxx_le=数值，≤ 筛选）；新滑块不再生成此参数
        const all = await db.productParamValue.findMany({
          where: { paramDefinitionId: { in: f.defIds } },
          select: { productId: true, valueString: true },
        });
        const matched = all
          .filter((row) => {
            if (!row.valueString) return false;
            return row.valueString.split("|").some((tok) => {
              const mhz = parseFreqMHz(tok);
              return mhz !== null && f.max !== undefined && mhz <= f.max;
            });
          })
          .map((r) => r.productId);
        productIdsByDef[f.def.id] = matched;
        continue;
      } else if (f.type === "boolean") {
        wherePv = { ...wherePv, valueBoolean: true };
      }
      const rows = await db.productParamValue.findMany({
        where: wherePv,
        select: { productId: true },
      });
      productIdsByDef[f.def.id] = rows.map((r) => r.productId);
    }
    const sets = Object.values(productIdsByDef).map((s) => new Set(s));
    if (sets.length > 0) {
      paramFilteredIds = [...sets[0]].filter((id) => sets.every((s) => s.has(id)));
      where.id = { in: paramFilteredIds };
    }
  }

  // 系列按全站品类分组：品牌分类(挂系列) → siteCategoryId → 全站品类
  const brandCatToSite = new Map<string, string | null>();
  for (const bc of brandCats) brandCatToSite.set(bc.id, bc.siteCategoryId);
  const allBrandCatIds = [...brandCatToSite.keys()];
  const allLines = await db.productLine.findMany({
    where: { isActive: true, categoryId: { in: allBrandCatIds } },
    include: {
      translations: true,
      brand: { include: { translations: true } },
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: [{ brand: { code: "asc" } }, { sortOrder: "asc" }],
  });
  const linesBySiteCat = new Map<string, any[]>();
  for (const l of allLines) {
    if (l._count.products === 0) continue;
    const siteId = brandCatToSite.get(l.categoryId);
    if (!siteId) continue;
    const arr = linesBySiteCat.get(siteId) ?? [];
    arr.push(l);
    linesBySiteCat.set(siteId, arr);
  }
  const linesForCat = (catId: string) =>
    (linesBySiteCat.get(catId) ?? []).map((l: any) => ({
      id: l.id,
      code: l.code,
      name:
        (l.translations ?? []).find((tr: any) => tr.locale === locale)?.name ??
        (l.translations ?? [])[0]?.name ??
        l.code,
      brandCode: l.brand.code,
      brandName:
        (l.brand.translations ?? []).find((tr: any) => tr.locale === locale)?.name ??
        (l.brand.translations ?? [])[0]?.name ??
        l.brand.code,
      count: l._count.products,
    }));

  const [products, brands] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        productLine: {
          include: { brand: { include: { translations: true } }, translations: true },
        },
        translations: true,
      },
      orderBy: [{ sortOrder: "asc" }, { model: "asc" }],
      take: 100,
    }),
    db.brand.findMany({
      where: { isActive: true },
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const I = {
    home: isEn ? "Home" : "首页",
    products: isEn ? "Products" : "产品中心",
    clearFilter: isEn ? "Clear Filters" : "清除参数筛选",
    allProducts: isEn ? "All Products" : "全部产品",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 text-sm text-slate-500">
        <a href={`/${locale}`} className="hover:text-sky-600">
          {I.home}
        </a>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{I.products}</span>
        {currentCategory && (
          <>
            <span className="mx-2">/</span>
            <span className="font-medium text-sky-700">
              {t(currentCategory.translations, locale, "name")}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <ProductFilters
          locale={locale}
          categories={categories.map((c) => ({
            id: c.id,
            code: c.code,
            name: t(c.translations, locale, "name") || c.code,
            parentId: c.parentId,
            series: linesForCat(c.id),
            children: c.children.map((ch) => ({
              id: ch.id,
              code: ch.code,
              name: t(ch.translations, locale, "name") || ch.code,
              parentId: ch.parentId,
              series: linesForCat(ch.id),
              children: [],
            })),
          }))}
          currentCategory={currentCategory?.code}
          brands={brands.map((b) => ({
            id: b.id,
            code: b.code,
            name: t(b.translations, locale, "name") || b.code,
          }))}
          currentBrand={brandId}
          currentQ={q ?? ""}
          currentLine={lineId}
        />

        <div className="flex-1">
          <ProductParamFilter
            locale={locale}
            filterDefs={filterDefs.map((d) => ({
              id: d.id,
              key: d.key,
              type: d.type,
              unit: d.unit,
              options: d.options,
              filterUI: d.filterUI ?? null,
              name:
                ((d as any).translations ?? []).find((tr: any) => tr.locale === locale)?.name ??
                ((d as any).translations ?? [])[0]?.name ??
                (d as any).key,
            }))}
            currentParams={sp}
            currentCategory={categoryCode}
            currentBrand={brandId}
            currentLine={lineId}
          />
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              {currentCategory ? t(currentCategory.translations, locale, "name") : I.allProducts}
              <span className="ml-2 text-sm font-normal text-slate-400">
                {isEn ? `Total ${products.length}` : `共 ${products.length} 款`}
              </span>
            </h1>
            <div className="flex items-center gap-3">
              {lineId && products.length > 1 && (
                <a
                  href={`/${locale}/compare?line=${lineId}`}
                  className="rounded-md border border-sky-300 px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                >
                  {isEn ? "Compare this Series" : "对比该系列全部型号"}
                </a>
              )}
              {filters.length > 0 && (
                <a
                  href={`/${locale}/products${categoryCode ? `?category=${categoryCode}` : ""}`}
                  className="text-sm text-sky-600 hover:underline"
                >
                  {I.clearFilter}
                </a>
              )}
            </div>
          </div>
          <ProductGrid products={products as any} />
        </div>
      </div>
    </div>
  );
}
