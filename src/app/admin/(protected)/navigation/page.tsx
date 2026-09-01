import { db } from "@/lib/db";
import { getNavTree, type NavNode } from "@/lib/nav";
import NavigationManager from "./navigation-manager";

export type NavBrandOpt = { id: string; code: string; zhName: string; enName: string };
export type NavPageOption = { brandId: string | null; label: string; path: string };

const slug = (code: string) =>
  code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const zhName = (trs: { locale: string; name: string }[]) =>
  trs.find((tr) => tr.locale === "zh")?.name ?? trs[0]?.name ?? "";

export default async function NavigationPage() {
  const [tree, brands, siteCats] = await Promise.all([
    getNavTree({ includeHidden: true }),
    db.brand.findMany({
      where: { isActive: true },
      include: { translations: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    db.category.findMany({
      where: { brandId: null },
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const navBrands: NavBrandOpt[] = brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return { id: b.id, code: b.code, zhName: t["zh"]?.name ?? b.code, enName: t["en"]?.name ?? "" };
  });

  // 已有页面选项（用于新增菜单时快速选择路径）
  const pageOptions: NavPageOption[] = [
    { brandId: null, label: "首页", path: "/" },
    { brandId: null, label: "产品中心", path: "/products" },
    { brandId: null, label: "资料下载", path: "/documents" },
    { brandId: null, label: "代理品牌", path: "/brands" },
    { brandId: null, label: "联系我们", path: "/contact" },
  ];
  for (const c of siteCats) {
    pageOptions.push({
      brandId: null,
      label: `品类 · ${zhName(c.translations)}`,
      path: `/products?category=${c.code}`,
    });
  }
  const brandCats = await db.category.findMany({
    where: { brandId: { not: null } },
    include: { translations: true },
    orderBy: { sortOrder: "asc" },
  });
  const catsByBrand = new Map<string, typeof brandCats>();
  for (const c of brandCats) {
    if (!c.brandId) continue;
    const arr = catsByBrand.get(c.brandId) ?? [];
    arr.push(c);
    catsByBrand.set(c.brandId, arr);
  }
  for (const b of brands) {
    pageOptions.push({ brandId: b.id, label: "首页", path: "/" });
    pageOptions.push({ brandId: b.id, label: "产品中心", path: "/category" });
    pageOptions.push({ brandId: b.id, label: "联系我们", path: "/contact" });
    for (const c of catsByBrand.get(b.id) ?? []) {
      pageOptions.push({
        brandId: b.id,
        label: `品类 · ${zhName(c.translations)}`,
        path: `/category/${slug(c.code)}`,
      });
    }
  }

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
      <NavigationManager tree={tree} brands={navBrands} pageOptions={pageOptions} />
    </div>
  );
}

export type { NavNode };
