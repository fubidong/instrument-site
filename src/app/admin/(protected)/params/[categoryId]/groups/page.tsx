import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import GroupList from "./group-list";

export default async function ParamGroupsPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  const [category, groups] = await Promise.all([
    db.category.findUnique({
      where: { id: categoryId },
      include: { translations: true },
    }),
    db.paramGroup.findMany({
      where: { categoryId },
      include: {
        translations: true,
        _count: { select: { paramDefs: true } },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!category) notFound();
  const t = Object.fromEntries(category.translations.map((tr) => [tr.locale, tr]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            参数分组 · {t["zh"]?.name ?? category.code}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            定义该类别下参数的分组结构（如"基本参数""输入特性"）
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/params/${categoryId}/defs`}
            className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            参数定义 →
          </Link>
          <Link
            href="/admin/params"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            ← 返回
          </Link>
        </div>
      </div>

      <GroupList categoryId={categoryId} groups={groups as any} />
    </div>
  );
}
