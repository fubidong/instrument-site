import Link from "next/link";
import { db } from "@/lib/db";
import { toggleBrandAction } from "./actions";
import DeleteBrandButton from "./delete-brand-button";
import ListFilterBar from "@/components/admin/list-filter-bar";

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;

  const where: any = {};
  if (status && status !== "all") where.isActive = status === "active";
  if (q?.trim()) {
    where.OR = [
      { code: { contains: q.trim(), mode: "insensitive" } },
      { translations: { some: { name: { contains: q.trim(), mode: "insensitive" } } } },
    ];
  }

  const brands = await db.brand.findMany({
    where,
    include: {
      translations: true,
      _count: { select: { products: true, productLines: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">品牌管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {brands.length} 个品牌，预置 17 个重点品牌
          </p>
        </div>
        <Link
          href="/admin/brands/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          + 新增品牌
        </Link>
      </div>

      {/* 筛选栏 */}
      <ListFilterBar
        basePath="/admin/brands"
        fields={[
          {
            key: "status",
            label: "全部状态",
            options: [
              { value: "active", label: "启用" },
              { value: "inactive", label: "停用" },
            ],
          },
        ]}
        searchPlaceholder="搜索品牌名/代码..."
      />

      <div className="rounded-lg border border-slate-200 bg-white">
        {brands.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            暂无品牌，点击右上角新增
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Logo</th>
                <th className="px-4 py-3 font-medium">品牌代码</th>
                <th className="px-4 py-3 font-medium">中文名</th>
                <th className="px-4 py-3 font-medium">英文名</th>
                <th className="px-4 py-3 font-medium">官网</th>
                <th className="px-4 py-3 font-medium">排序</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">产品/系列</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brands.map((brand) => {
                const t = Object.fromEntries(
                  brand.translations.map((tr) => [tr.locale, tr])
                );
                return (
                  <tr key={brand.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {brand.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={brand.logo}
                          alt="logo"
                          className="h-8 w-14 rounded border border-slate-100 bg-white object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-300">无</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {brand.code}
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {t["zh"]?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t["en"]?.name ?? "-"}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-slate-500">
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 hover:underline"
                        >
                          {brand.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{brand.sortOrder}</td>
                    <td className="px-4 py-3">
                      <form action={toggleBrandAction}>
                        <input type="hidden" name="id" value={brand.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={brand.isActive ? "0" : "1"}
                        />
                        <button
                          type="submit"
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            brand.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {brand.isActive ? "启用" : "停用"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {brand._count.products} / {brand._count.productLines}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/brands/${brand.id}/edit`}
                          className="text-sky-600 hover:underline"
                        >
                          编辑
                        </Link>
                        <DeleteBrandButton id={brand.id} />
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
