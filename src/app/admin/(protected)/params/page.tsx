import Link from "next/link";
import { db } from "@/lib/db";

export default async function ParamsPage() {
  const categories = await db.category.findMany({
    include: {
      translations: true,
      _count: { select: { paramGroups: true, paramDefs: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">参数模板</h1>
        <p className="mt-1 text-sm text-slate-500">
          为每个产品类别定义参数分组和参数项。选择类别进入管理：
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.length === 0 ? (
          <p className="text-sm text-slate-400">
            暂无类别，请先在「产品类别」中创建
          </p>
        ) : (
          categories.map((cat) => {
            const t = Object.fromEntries(cat.translations.map((tr) => [tr.locale, tr]));
            return (
              <div
                key={cat.id}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    {t["zh"]?.name ?? cat.code}
                  </span>
                  <span className="text-xs text-slate-400">{cat.code}</span>
                </div>
                <p className="mb-3 text-sm text-slate-500">
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
          })
        )}
      </div>
    </div>
  );
}
