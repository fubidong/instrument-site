import { db } from "@/lib/db";
import NavigationManager, { type NavCategory, type NavBrand } from "./navigation-manager";

export default async function NavigationPage() {
  const [cats, brands] = await Promise.all([
    db.category.findMany({
      include: {
        translations: true,
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    db.brand.findMany({
      include: { translations: true },
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
  ]);

  const categories: NavCategory[] = cats.map((c) => {
    const t = Object.fromEntries(c.translations.map((tr) => [tr.locale, tr]));
    return {
      id: c.id,
      code: c.code,
      parentId: c.parentId,
      brandId: c.brandId,
      sortOrder: c.sortOrder,
      showInNav: c.showInNav,
      zhName: t["zh"]?.name ?? c.code,
      enName: t["en"]?.name ?? "",
      productCount: c._count.products,
    };
  });

  const navBrands: NavBrand[] = brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return {
      id: b.id,
      code: b.code,
      sortOrder: b.sortOrder,
      zhName: t["zh"]?.name ?? b.code,
      enName: t["en"]?.name ?? "",
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">导航设置</h1>
          <p className="mt-1 text-sm text-slate-500">
            集中控制各品类是否显示在站点主导航（综合站 + 各品牌站），支持按品牌筛选与批量显隐
          </p>
        </div>
      </div>
      <NavigationManager categories={categories} brands={navBrands} />
    </div>
  );
}
