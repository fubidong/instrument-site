import { db } from "@/lib/db";
import { t } from "@/lib/site";
import ProductFilters from "./product-filters";
import ProductGrid from "./product-grid";

export const metadata = { title: "产品中心 | 按参数选型" };

// 解析 URL 中的动态参数筛选条件
function parseParamFilters(searchParams: URLSearchParams, defs: any[]) {
  const filters: { def: any; type: string; min?: number; max?: number; values?: string[]; on?: boolean }[] = [];
  for (const def of defs) {
    if (!def.isFilterable) continue;
    const min = searchParams.get(`p_${def.key}_min`);
    const max = searchParams.get(`p_${def.key}_max`);
    const values = searchParams.get(`p_${def.key}`);
    if (def.type === "number" || def.type === "range") {
      if (min || max) {
        filters.push({
          def,
          type: def.type,
          min: min ? parseFloat(min) : undefined,
          max: max ? parseFloat(max) : undefined,
        });
      }
    } else if (def.type === "enum") {
      if (values) {
        filters.push({ def, type: "enum", values: values.split(",").filter(Boolean) });
      }
    } else if (def.type === "boolean") {
      const on = searchParams.get(`p_${def.key}`);
      if (on === "1" || on === "true") filters.push({ def, type: "boolean", on: true });
    }
  }
  return filters;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const searchParamsObj = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => {
    if (v) searchParamsObj.set(k, v);
  });

  const categoryCode = sp.category;
  const brandId = sp.brand;
  const lineId = sp.line;
  const q = sp.q;

  // 类别（支持顶层或子类 code）
  const categories = await db.category.findMany({
    include: { translations: true, children: { include: { translations: true } } },
    orderBy: { sortOrder: "asc" },
  });
  const catMap = new Map(categories.map((c) => [c.code, c]));
  let currentCategory = categoryCode ? catMap.get(categoryCode) : undefined;
  // 如果是父类，包含子类
  let categoryIds: string[] = [];
  if (currentCategory) {
    categoryIds = [currentCategory.id, ...currentCategory.children.map((c) => c.id)];
  }

  // 当前类别参数定义（可筛选的）
  const filterDefs = currentCategory
    ? await db.paramDefinition.findMany({
        where: { categoryId: currentCategory.id, isFilterable: true },
        include: { translations: true },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  const filters = parseParamFilters(searchParamsObj, filterDefs);

  // 构建查询
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

  // 参数筛选：先找出符合参数条件的产品 id
  let paramFilteredIds: string[] | null = null;
  if (filters.length > 0) {
    const defIds = filters.map((f) => f.def.id);
    // 每个筛选条件的 OR/AND 处理：enum 用 OR，number 用范围
    // 简化：所有条件 AND
    const productIdsByDef: Record<string, string[]> = {};
    for (const f of filters) {
      let wherePv: any = { paramDefinitionId: f.def.id };
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
        wherePv = { ...wherePv, valueString: { in: f.values } };
      } else if (f.type === "boolean") {
        wherePv = { ...wherePv, valueBoolean: true };
      }
      const rows = await db.productParamValue.findMany({
        where: wherePv,
        select: { productId: true },
      });
      productIdsByDef[f.def.id] = rows.map((r) => r.productId);
    }
    // 所有条件的交集
    const sets = Object.values(productIdsByDef).map((s) => new Set(s));
    if (sets.length > 0) {
      paramFilteredIds = [...sets[0]].filter((id) => sets.every((s) => s.has(id)));
      where.id = { in: paramFilteredIds };
    }
  }

  const [products, brands, lines] = await Promise.all([
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
    db.productLine.findMany({
      where: { isActive: true },
      include: { translations: true, brand: { include: { translations: true } } },
      orderBy: [{ brand: { code: "asc" } }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* 面包屑 */}
      <div className="mb-6 text-sm text-slate-500">
        <a href="/" className="hover:text-sky-600">首页</a>
        <span className="mx-2">/</span>
        <span className="text-slate-800">产品中心</span>
        {currentCategory && (
          <>
            <span className="mx-2">/</span>
            <span className="text-sky-700 font-medium">{t(currentCategory.translations, "zh", "name")}</span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* 左侧筛选器 */}
        <ProductFilters
          categories={categories.map((c) => ({
            id: c.id,
            code: c.code,
            zhName: t(c.translations, "zh", "name") || c.code,
            parentId: c.parentId,
          }))}
          currentCategory={currentCategory?.code}
          filterDefs={filterDefs.map((d) => ({
            id: d.id,
            key: d.key,
            type: d.type,
            unit: d.unit,
            options: d.options,
            zhName: t(d.translations, "zh", "name") || d.key,
            enName: t(d.translations, "en", "name") || d.key,
          }))}
          currentParams={sp}
          brands={brands.map((b) => ({
            id: b.id,
            code: b.code,
            zhName: t(b.translations, "zh", "name") || b.code,
          }))}
          currentBrand={brandId}
          currentQ={q ?? ""}
        />

        {/* 右侧产品列表 */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">
              {currentCategory ? t(currentCategory.translations, "zh", "name") : "全部产品"}
              <span className="ml-2 text-sm font-normal text-slate-400">
                共 {products.length} 款
              </span>
            </h1>
            {filters.length > 0 && (
              <a href={`/products${categoryCode ? `?category=${categoryCode}` : ""}`} className="text-sm text-sky-600 hover:underline">
                清除参数筛选
              </a>
            )}
          </div>
          <ProductGrid products={products as any} />
        </div>
      </div>
    </div>
  );
}
