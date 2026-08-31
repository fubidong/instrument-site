import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import CategoryForm from "../../category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, allCats] = await Promise.all([
    db.category.findUnique({ where: { id }, include: { translations: true } }),
    db.category.findMany({ include: { translations: true } }),
  ]);

  if (!category) notFound();

  const options = allCats.map((c) => {
    const t = Object.fromEntries(c.translations.map((tr) => [tr.locale, tr]));
    // 计算深度（简化：只列直接父级逻辑，用 0）
    return { id: c.id, code: c.code, name: t["zh"]?.name ?? c.code, depth: 0 };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">编辑类别</h1>
          <p className="mt-1 text-sm text-slate-500">{category.code}</p>
        </div>
        <Link href="/admin/categories" className="text-sm text-sky-600 hover:underline">
          ← 返回列表
        </Link>
      </div>
      <CategoryForm category={category} categories={options} />
    </div>
  );
}
