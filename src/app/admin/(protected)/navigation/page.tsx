import { db } from "@/lib/db";
import { getNavTree, type NavNode } from "@/lib/nav";
import NavigationManager from "./navigation-manager";

export type NavBrandOpt = { id: string; code: string; zhName: string; enName: string };

export default async function NavigationPage() {
  const [tree, brands] = await Promise.all([
    getNavTree({ includeHidden: true }),
    db.brand.findMany({
      where: { isActive: true },
      include: { translations: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
  ]);

  const navBrands: NavBrandOpt[] = brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return { id: b.id, code: b.code, zhName: t["zh"]?.name ?? b.code, enName: t["en"]?.name ?? "" };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">导航菜单管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            独立的可配置导航（支持无限级层级、显示开关、排序、外链），综合站与各品牌站各自一套；软删除可恢复
          </p>
        </div>
      </div>
      <NavigationManager tree={tree} brands={navBrands} />
    </div>
  );
}

export type { NavNode };
