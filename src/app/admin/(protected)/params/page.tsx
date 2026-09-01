import Link from "next/link";
import { db } from "@/lib/db";

export default async function ParamsPage() {
  const categories = await db.category.findMany({
    include: {
      translations: true,
      brand: { include: { translations: true } },
      _count: { select: { paramGroups: true, paramDefs: true } },
    },
    orderBy: [{ brandId: "asc" }, { sortOrder: "asc" }],
  });

  // 按品牌分组：品牌分类在前（含品牌名），全站品类在后
  const brandCats = categories.filter((c) => c.brandId);
  const siteCats = categories.filter((c) => !c.brandId);
  const byBrand = new Map<string, typeof brandCats>();
  for (const c of brandCats) {
    const key = c.brandId!;
    if (!byBrand.has(key)) byBrand.set(key, []);
    byBrand.get(key)!.push(c);
  }
  const brandNames = new Map<string, string>();
  for (const c of brandCats) {
    if (!c.brand?.translations) continue;
    const bt = Object.fromEntries(c.brand.translations.map((tr) => [tr.locale, tr]));
    brandNames.set(c.brandId!, bt["zh"]?.name ?? c.brand!.code);
  }

  const nameOf = (c: any) => {
    const t = Object.fromEntries(c.translations.map((tr: any) => [tr.locale, tr]));
    return t["zh"]?.name ?? c.code;
  };
  const CatCard = ({ cat }: { cat: any }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">{nameOf(cat)}</span>
        <span className="text-xs text-slate-400">{cat.code}</span>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        {cat._count.paramGroups} 个分组 · {cat._count.paramDefs} 个参数
      </p>
      <div className="flex gap-2">
        <Link
          href={`/admin/params/${cat.id}/groups`}
          className="rounded bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
        >
          分组管理
        </Link>
        <Link
          href={`/admin/params/${cat.id}/defs`}
          className="rounded bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          参数定义
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">参数模板</h1>
        <p className="mt-1 text-sm text-slate-500">
          参数模板按品牌分类组织，产品录入时自动加载对应模板。
        </p>
      </div>

      {[...byBrand.keys()].map((bid) => (
        <div key={bid}>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            品牌分类 · {brandNames.get(bid)}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byBrand.get(bid)!.map((cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        </div>
      ))}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">全站品类（综合站聚合）</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {siteCats.length === 0 ? (
            <p className="text-sm text-slate-400">暂无全站品类</p>
          ) : (
            siteCats.map((cat) => <CatCard key={cat.id} cat={cat} />)
          )}
        </div>
      </div>
    </div>
  );
}
