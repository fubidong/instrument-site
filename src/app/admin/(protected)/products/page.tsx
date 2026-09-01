import Link from "next/link";
import { db } from "@/lib/db";
import ProductsTable from "./products-table";

/** 构建“品类 → 匹配的品牌分类 id 集”映射：
 *  - 品牌分类：自身 + 品牌分类后代
 *  - 全站品类：siteCategoryId 落在该全站品类（含后代）下的品牌分类 + 这些品牌分类的后代
 */
function buildMatchMap(allCats: any[]) {
  const childrenOf = new Map<string, any[]>();
  for (const c of allCats) {
    if (c.parentId) {
      const arr = childrenOf.get(c.parentId) ?? [];
      arr.push(c);
      childrenOf.set(c.parentId, arr);
    }
  }
  function subtree(rootId: string): string[] {
    const out = [rootId];
    for (const k of childrenOf.get(rootId) ?? []) out.push(...subtree(k.id));
    return out;
  }
  const matchMap = new Map<string, string[]>();
  const brandOf = new Map(allCats.filter((c) => c.brandId).map((c) => [c.id, c.brandId]));
  for (const c of allCats) {
    let ids: string[];
    if (c.brandId) {
      ids = subtree(c.id);
    } else {
      const siteSub = new Set(subtree(c.id));
      ids = [];
      for (const b of allCats) {
        if (b.brandId && b.siteCategoryId && siteSub.has(b.siteCategoryId)) {
          ids.push(...subtree(b.id));
        }
      }
    }
    matchMap.set(c.id, ids);
  }
  return { matchMap, brandOf };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; category?: string; line?: string; status?: string; q?: string }>;
}) {
  const { brand, category, line, status, q } = await searchParams;

  const allCats = await db.category.findMany({
    select: { id: true, code: true, parentId: true, brandId: true, siteCategoryId: true, sortOrder: true },
  });
  const { matchMap, brandOf } = buildMatchMap(allCats);

  const where: any = {};
  if (brand && brand !== "all") where.brandId = brand;
  if (category && category !== "all") {
    const matchIds = matchMap.get(category) ?? [category];
    where.categoryId = { in: matchIds };
  }
  if (line && line !== "all") where.productLineId = line;
  if (status && status !== "all") where.isActive = status === "active";
  if (q?.trim()) {
    where.OR = [
      { model: { contains: q.trim(), mode: "insensitive" } },
      { translations: { some: { name: { contains: q.trim(), mode: "insensitive" } } } },
    ];
  }

  const [products, brands, categories, lines] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        productLine: {
          include: { translations: true, brand: { include: { translations: true } } },
        },
        translations: true,
      },
      orderBy: [{ productLine: { code: "asc" } }, { sortOrder: "asc" }, { model: "asc" }],
    }),
    db.brand.findMany({
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.category.findMany({
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.productLine.findMany({
      include: { translations: true, brand: { include: { translations: true } } },
      orderBy: [{ brand: { code: "asc" } }, { sortOrder: "asc" }],
    }),
  ]);

  const brandOptions = brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return { id: b.id, label: t["zh"]?.name ?? b.code };
  });
  // 品类选项：带层级/品牌/匹配信息，供前端联动
  const catById = new Map(categories.map((c) => [c.id, c]));
  const categoryOptions = categories.map((c) => {
    const t = Object.fromEntries(c.translations.map((tr) => [tr.locale, tr]));
    const matchIds = matchMap.get(c.id) ?? [c.id];
    const matchBrands = [...new Set(matchIds.map((id) => brandOf.get(id)).filter(Boolean))];
    return {
      id: c.id,
      label: t["zh"]?.name ?? c.code,
      code: c.code,
      parentId: c.parentId,
      brandId: c.brandId,
      sortOrder: c.sortOrder,
      matchIds,
      matchBrands,
    };
  });
  const lineOptions = lines.map((l) => {
    const lt = Object.fromEntries(l.translations.map((tr) => [tr.locale, tr]));
    const bt = Object.fromEntries(l.brand.translations.map((tr) => [tr.locale, tr]));
    return {
      id: l.id,
      label: `${bt["zh"]?.name ?? l.brand.code} / ${lt["zh"]?.name ?? l.code}`,
      code: l.code,
      brandId: l.brandId,
      categoryId: l.categoryId,
    };
  });

  return (
    <ProductsTable
      products={products as any}
      brandOptions={brandOptions}
      categoryOptions={categoryOptions}
      lineOptions={lineOptions}
      currentBrand={brand ?? "all"}
      currentCategory={category ?? "all"}
      currentLine={line ?? "all"}
      currentStatus={status ?? "all"}
      currentQ={q ?? ""}
    />
  );
}
