import Link from "next/link";
import { db } from "@/lib/db";
import DeleteProductButton from "./delete-product-button";

export default async function ProductsPage() {
  const products = await db.product.findMany({
    include: {
      productLine: {
        include: { translations: true, brand: { include: { translations: true } } },
      },
      translations: true,
    },
    orderBy: [{ productLine: { code: "asc" } }, { sortOrder: "asc" }, { model: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">产品型号</h1>
          <p className="mt-1 text-sm text-slate-500">共 {products.length} 个型号</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          + 新增产品
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {products.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">暂无产品，点击右上角新增</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">型号</th>
                <th className="px-4 py-3 font-medium">品牌</th>
                <th className="px-4 py-3 font-medium">系列</th>
                <th className="px-4 py-3 font-medium">中文名</th>
                <th className="px-4 py-3 font-medium">英文名</th>
                <th className="px-4 py-3 font-medium">排序</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const bt = Object.fromEntries(
                  p.productLine.brand.translations.map((tr) => [tr.locale, tr])
                );
                const lt = Object.fromEntries(p.productLine.translations.map((tr) => [tr.locale, tr]));
                const pt = Object.fromEntries(p.translations.map((tr) => [tr.locale, tr]));
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                      {p.model}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{bt["zh"]?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{lt["zh"]?.name ?? p.productLine.code}</td>
                    <td className="px-4 py-3 text-slate-800">{pt["zh"]?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{pt["en"]?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{p.sortOrder}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.isActive ? "启用" : "停用"}
                        {p.isFeatured && (
                          <span className="ml-1 rounded bg-rose-100 px-1 text-rose-600">荐</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="text-sky-600 hover:underline"
                        >
                          编辑
                        </Link>
                        <DeleteProductButton id={p.id} />
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
