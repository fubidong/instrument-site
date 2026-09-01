import Link from "next/link";
import { db } from "@/lib/db";
import CategoryForm from "../category-form";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const { parent } = await searchParams;
  const allCats = await db.category.findMany({ include: { translations: true } });
  const options = allCats.map((c) => {
    const t = Object.fromEntries(c.translations.map((tr) => [tr.locale, tr]));
    return { id: c.id, code: c.code, name: t["zh"]?.name ?? c.code, depth: 0 };
  });

  const parentCat = parent ? allCats.find((c) => c.id === parent) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">新增类别</h1>
          <p className="mt-1 text-sm text-slate-500">
            {parentCat
              ? `在「${parentCat.translations.find((t) => t.locale === "zh")?.name ?? parentCat.code}」下新建子类别`
              : "创建后自动跳转到编辑页补充详细内容"}
          </p>
        </div>
        <Link href="/admin/categories" className="text-sm text-sky-600 hover:underline">
          ← 返回列表
        </Link>
      </div>
      <CategoryForm category={null} categories={options} presetParentId={parent} />
    </div>
  );
}
