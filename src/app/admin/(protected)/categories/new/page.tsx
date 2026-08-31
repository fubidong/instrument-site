import Link from "next/link";
import { db } from "@/lib/db";
import CategoryForm from "../category-form";

export default async function NewCategoryPage() {
  const allCats = await db.category.findMany({ include: { translations: true } });
  const options = allCats.map((c) => {
    const t = Object.fromEntries(c.translations.map((tr) => [tr.locale, tr]));
    return { id: c.id, code: c.code, name: t["zh"]?.name ?? c.code, depth: 0 };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">新增类别</h1>
          <p className="mt-1 text-sm text-slate-500">
            创建后自动跳转到编辑页补充详细内容
          </p>
        </div>
        <Link href="/admin/categories" className="text-sm text-sky-600 hover:underline">
          ← 返回列表
        </Link>
      </div>
      <CategoryForm category={null} categories={options} />
    </div>
  );
}
