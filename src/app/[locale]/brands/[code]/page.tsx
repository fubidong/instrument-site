import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import { parseFreqMHz, normParamValue, formatFreq } from "@/lib/param-alias";
import { routing } from "@/i18n/routing";
import BrandCategoryTree, { type BrandCatNode } from "../brand-filter";
import ProductParamFilter from "../../products/product-param-filter";
import ProductGrid from "../../products/product-grid";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; code: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const sp = await searchParams;
  const searchParamsObj = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => {
    if (v) searchParamsObj.set(k, v);
  });

  const brand =
    (await db.brand.findUnique({ where: { code }, include: { translations: true } })) ??
    (await db.brand.findMany({ include: { translations: true } })).find(
      (b) => b.code.toLowerCase() === code.toLowerCase()
    ) ??
    null;
  if (!brand || !brand.isActive) notFound();

  const bt = Object.fromEntries(brand.translations.map((tr) => [tr.locale, tr]));
  const brandName = bt[locale]?.name ?? bt["zh"]?.name ?? brand.code;
  const basePath = `/brands/${brand.code}`;

  // 品牌分类树（含系列统计）
  const cats = await db.category.findMany({
    where: { brandId: brand.id },
    include: {
      translations: true,
      productLines: {
        where: { isActive: true },
        include: { translations: true, _count: { select: { products: { where: { isActive: true } } } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const productsAll = await db.product.findMany({
    where: { brandId: brand.id, isActive: true },
    select: {
      id: true,
      model: true,
      coverImage: true,
      isFeatured: true,
      categoryId: true,
      productLineId: true,
      sortOrder: true,
      translations: true,
      category: { select: { parentId: true } },
      productLine: {
        select: {
          code: true,
          translations: true,
          brand: { select: { translations: true } },
        },
      },
    },
  });

  // 产品计数（按分类，含子孙）
  const countByCat = new Map<string, number>();
  for (const p of productsAll) countByCat.set(p.categoryId, (countByCat.get(p.categoryId) ?? 0) + 1);
  const catById = new Map(cats.map((c) => [c.id, c]));
  const countWithDescendants = (id: string): number => {
    let n = countByCat.get(id) ?? 0;
    for (const c of cats) if (c.parentId === id) n += countWithDescendants(c.id);
    return n;
  };
  const childrenOf = (id: string) => cats.filter((c) => c.parentId === id);

  // 组装品类树（含系列）
  const catNode = (c: (typeof cats)[number]): BrandCatNode => ({
    id: c.id,
    code: c.code,
    name: t(c.translations, locale, "name") || c.code,
    count: countWithDescendants(c.id),
    parentId: c.parentId,
    series: c.productLines
      .filter((l) => l._count.products > 0)
      .map((l) => ({
        id: l.id,
        code: l.code,
        name: t(l.translations, locale, "name") || l.code,
        count: l._count.products,
      })),
    children: childrenOf(c.id).map(catNode),
  });
  const categoryTree: BrandCatNode[] = cats.filter((c) => !c.parentId).map(catNode);

  // 当前选中品类（默认第一个顶级品类；支持子品类，如 ?category=SIGLENT-HI-RES-OSC）
  const findNode = (nodes: BrandCatNode[], code: string): BrandCatNode | null => {
    for (const n of nodes) {
      if (n.code === code) return n;
      const found = findNode(n.children, code);
      if (found) return found;
    }
    return null;
  };
  const categoryCode = sp.category && findNode(categoryTree, sp.category) ? sp.category : categoryTree[0]?.code;
  const currentTop = findNode(categoryTree, categoryCode) ?? categoryTree[0];
  const catScope = new Set<string>();
  const collectScope = (c: BrandCatNode) => {
    catScope.add(c.id);
    c.children.forEach(collectScope);
  };
  if (currentTop) collectScope(currentTop);

  // 重要指标筛选定义（当前品类范围，isHighlight=true，按 key 聚合）
  let filterDefs: any[] = [];
  if (currentTop) {
    const scopeCatIds = [...catScope];
    const rawDefs = await db.paramDefinition.findMany({
      where: { categoryId: { in: scopeCatIds }, isHighlight: true, isFilterable: true },
      include: { translations: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const byKey = new Map<string, any[]>();
    for (const d of rawDefs) {
      const arr = byKey.get(d.key) ?? [];
      arr.push(d);
      byKey.set(d.key, arr);
    }
    for (const [key, defs] of byKey) {
      filterDefs.push({ ...defs[0], defIds: defs.map((d: any) => d.id) });
    }
    // 聚合可选档位（滑块/胶囊）
    filterDefs = await Promise.all(
      filterDefs.map(async (fd: any) => {
        const rows = await db.productParamValue.findMany({
          where: { paramDefinitionId: { in: fd.defIds } },
          select: { valueString: true },
          distinct: ["valueString"],
        });
        const freqMap = new Map<number, string>();
        const otherMap = new Map<string, string>();
        for (const r of rows) {
          if (!r.valueString) continue;
          const v = r.valueString.trim().replace(/[；;，,。、\u00A0]+$/g, "");
          if (!v) continue;
          if (/[~～\-–—]/.test(v)) continue;
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
          const arr = [...freqMap.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, val]) => ({ value: val, label_zh: val, label_en: val }));
          return { ...fd, type: "enum", options: JSON.stringify(arr) };
        } else if (otherMap.size > 0) {
          const arr = [...otherMap.entries()]
            .sort((a, b) => a[0].localeCompare(b[0], "zh"))
            .map(([, val]) => ({ value: val, label_zh: val, label_en: val }));
          return { ...fd, type: "enum", options: JSON.stringify(arr) };
        }
        return { ...fd, options: null };
      })
    );
  }

  const filters = parseParamFilters(searchParamsObj, filterDefs);

  // 产品过滤（品类范围 + 系列 + 参数）
  let productIds = productsAll.filter((p) => catScope.has(p.categoryId)).map((p) => p.id);
  const lineId = sp.line;
  if (lineId) productIds = productIds.filter((id) => productsAll.find((p) => p.id === id)?.productLineId === lineId);

  if (filters.length > 0) {
    const productIdsByDef: Record<string, string[]> = {};
    for (const f of filters) {
      let wherePv: any = { paramDefinitionId: { in: f.defIds } };
      if (f.type === "number" || f.type === "range") {
        if (f.min !== undefined && f.max !== undefined) {
          wherePv = { ...wherePv, OR: [{ valueNumber: { gte: f.min, lte: f.max } }, { valueMin: { gte: f.min }, valueMax: { lte: f.max } }] };
        } else if (f.min !== undefined) {
          wherePv = { ...wherePv, OR: [{ valueNumber: { gte: f.min } }, { valueMin: { gte: f.min } }] };
        } else if (f.max !== undefined) {
          wherePv = { ...wherePv, OR: [{ valueNumber: { lte: f.max } }, { valueMax: { lte: f.max } }] };
        }
      } else if (f.type === "enum") {
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
      const rows = await db.productParamValue.findMany({ where: wherePv, select: { productId: true } });
      productIdsByDef[f.def.id] = rows.map((r) => r.productId);
    }
    const sets = Object.values(productIdsByDef).map((s) => new Set(s));
    if (sets.length > 0) {
      const inter = [...sets[0]].filter((id) => sets.every((s) => s.has(id)));
      productIds = productIds.filter((id) => inter.includes(id));
    }
  }

  const products = productsAll
    .filter((p) => productIds.includes(p.id))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.model.localeCompare(b.model))
    .slice(0, 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-sky-600">
          {isEn ? "Home" : "首页"}
        </Link>
        <span className="mx-2">/</span>
        <Link href="/brands" className="hover:text-sky-600">
          {isEn ? "Brands" : "代理品牌"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{brandName}</span>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {brand.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo} alt={brandName} className="h-16 object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{brandName}</h1>
              <div className="text-sm text-slate-400">
                {bt["en"]?.name ?? ""}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-3 text-sky-600 hover:underline"
                  >
                    {isEn ? "Official Site" : "访问官网"} ↗
                  </a>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/contact"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            {isEn ? `Get ${brandName} Quote` : `获取 ${brandName} 产品报价`}
          </Link>
        </div>
        {bt[locale]?.description && (
          <p className="mt-4 text-sm leading-6 text-slate-600">{bt[locale].description}</p>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        {/* 左：品类 → 系列 联动折叠树 */}
        <BrandCategoryTree
          categories={categoryTree}
          currentCategory={currentTop?.code}
          currentLine={lineId}
          basePath={basePath}
          isEn={isEn}
        />

        {/* 右：重要指标筛选 + 产品 */}
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
            currentCategory={currentTop?.code}
            currentLine={lineId}
            basePath={basePath}
          />
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              {currentTop?.name ?? brandName}
              <span className="ml-2 text-sm font-normal text-slate-400">
                {isEn ? `Total ${products.length}` : `共 ${products.length} 款`}
              </span>
            </h1>
            {filters.length > 0 && (
              <Link
                href={`${basePath}?category=${currentTop?.code ?? ""}`}
                className="text-sm text-sky-600 hover:underline"
              >
                {isEn ? "Clear Filters" : "清除参数筛选"}
              </Link>
            )}
          </div>
          <ProductGrid products={products as any} />
        </div>
      </div>
    </div>
  );
}
