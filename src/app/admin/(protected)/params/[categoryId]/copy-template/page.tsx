import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import CopyTemplateForm from "./copy-template-form";

export default async function CopyTemplatePage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  const [targetCategory, categories] = await Promise.all([
    db.category.findUnique({
      where: { id: categoryId },
      include: { translations: true },
    }),
    db.category.findMany({
      include: {
        translations: true,
        _count: { select: { paramGroups: true, paramDefs: true } },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!targetCategory) notFound();
  const tt = Object.fromEntries(targetCategory.translations.map((tr) => [tr.locale, tr]));

  const options = categories
    .filter((c) => c.id !== categoryId)
    .map((c) => {
      const t = Object.fromEntries(c.translations.map((tr) => [tr.locale, tr]));
      return {
        id: c.id,
        name: t["zh"]?.name ?? c.code,
        code: c.code,
        groupCount: c._count.paramGroups,
        defCount: c._count.paramDefs,
      };
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">复制参数模板</h1>
          <p className="mt-1 text-sm text-slate-500">
            将其他类别的参数模板复制到「{tt["zh"]?.name ?? targetCategory.code}」
          </p>
        </div>
        <Link
          href={`/admin/params/${categoryId}/defs`}
          className="text-sm text-sky-600 hover:underline"
        >
          ← 返回参数定义
        </Link>
      </div>

      <CopyTemplateForm targetCategoryId={categoryId} targetName={tt["zh"]?.name ?? targetCategory.code} options={options} />
    </div>
  );
}
