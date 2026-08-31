import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import DefList from "./def-list";

export default async function ParamDefsPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  const [category, groups, defs] = await Promise.all([
    db.category.findUnique({
      where: { id: categoryId },
      include: { translations: true },
    }),
    db.paramGroup.findMany({
      where: { categoryId },
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.paramDefinition.findMany({
      where: { categoryId },
      include: { translations: true, paramGroup: { include: { translations: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  if (!category) notFound();
  const t = Object.fromEntries(category.translations.map((tr) => [tr.locale, tr]));

  const groupOptions = groups.map((g) => {
    const gt = Object.fromEntries(g.translations.map((tr) => [tr.locale, tr]));
    return { id: g.id, code: g.code, zhName: gt["zh"]?.name ?? g.code, enName: gt["en"]?.name ?? "" };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            参数定义 · {t["zh"]?.name ?? category.code}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            定义该类别下所有参数项，产品录入时按此模板渲染表单
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/params/${categoryId}/groups`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            ← 分组管理
          </Link>
          <Link
            href={`/admin/params/${categoryId}/copy-template`}
            className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"
          >
            复制其他类别模板
          </Link>
        </div>
      </div>

      <DefList categoryId={categoryId} groups={groupOptions} defs={defs as any} />
    </div>
  );
}
