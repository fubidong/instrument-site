import Link from "next/link";
import { db } from "@/lib/db";
import DeleteProductLineButton from "./delete-product-line-button";

export default async function ProductLinesPage() {
  const lines = await db.productLine.findMany({
    include: {
      brand: { include: { translations: true } },
      category: { include: { translations: true } },
      translations: true,
      _count: { select: { products: true } },
    },
    orderBy: [{ brand: { code: "asc" } }, { sortOrder: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">产品系列</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {lines.length} 个系列（品牌 → 系列 → 型号）
          </p>
        </div>
        <Link
          href="/admin/product-lines/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          + 新增系列
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {lines.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            暂无系列，点击右上角新增
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">系列</th>
                <th className="px-4 py-3 font-medium">品牌</th>
                <th className="px-4 py-3 font-medium">类别</th>
                <th className="px-4 py-3 font-medium">中文名</th>
                <th className="px-4 py-3 font-medium">英文名</th>
                <th className="px-4 py-3 font-medium">排序</th>
                <th className="px-4 py-3 font-medium">产品数</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => {
                const bt = Object.fromEntries(line.brand.translations.map((tr) => [tr.locale, tr]));
                const ct = Object.fromEntries(line.category.translations.map((tr) => [tr.locale, tr]));
                const lt = Object.fromEntries(line.translations.map((tr) => [tr.locale, tr]));
                return (
                  <tr key={line.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{line.code}</td>
                    <td className="px-4 py-3 text-slate-800">{bt["zh"]?.name ?? line.brand.code}</td>
                    <td className="px-4 py-3 text-slate-600">{ct["zh"]?.name ?? line.category.code}</td>
                    <td className="px-4 py-3 text-slate-800">{lt["zh"]?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{lt["en"]?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{line.sortOrder}</td>
                    <td className="px-4 py-3 text-slate-500">{line._count.products}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          line.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {line.isActive ? "启用" : "停用"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/product-lines/${line.id}/edit`}
                          className="text-sky-600 hover:underline"
                        >
                          编辑
                        </Link>
                        <DeleteProductLineButton id={line.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
