import Link from "next/link";
import { db } from "@/lib/db";
import DeleteSupportArticleButton from "./delete-support-article-button";
import ListFilterBar from "@/components/admin/list-filter-bar";

const TYPE_LABEL: Record<string, string> = {
  solution: "解决方案",
  tech: "技术文章",
  faq: "常见问题",
};

const TYPE_BADGE: Record<string, string> = {
  solution: "bg-indigo-100 text-indigo-700",
  tech: "bg-sky-100 text-sky-700",
  faq: "bg-amber-100 text-amber-700",
};

export default async function SupportArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; brand?: string; q?: string }>;
}) {
  const { type, brand, q } = await searchParams;

  const where: any = {};
  if (type && type !== "all") where.type = type;
  if (brand && brand !== "all") where.brandId = brand;
  if (q?.trim()) {
    where.translations = { some: { title: { contains: q.trim(), mode: "insensitive" } } };
  }

  const [articles, brands] = await Promise.all([
    db.supportArticle.findMany({
      where,
      include: {
        brand: { include: { translations: true } },
        pdfLinks: { include: { pdfAsset: { select: { filename: true } } } },
        productLinks: { include: { product: { select: { model: true } } } },
        translations: true,
      },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    db.brand.findMany({
      where: { isActive: true },
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const brandOptions = brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return { id: b.id, label: t["zh"]?.name ?? b.code };
  });

  function fmtDate(d: Date | null): string {
    if (!d) return "-";
    return new Date(d).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">支持中心</h1>
          <p className="mt-1 text-sm text-slate-500">共 {articles.length} 篇文章</p>
        </div>
        <Link
          href="/admin/support-articles/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          + 新增文章
        </Link>
      </div>

      <ListFilterBar
        basePath="/admin/support-articles"
        fields={[
          {
            key: "type",
            label: "全部类型",
            options: Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: l })),
          },
          {
            key: "brand",
            label: "全部品牌",
            options: brandOptions.map((b) => ({ value: b.id, label: b.label })),
          },
        ]}
        searchPlaceholder="搜索标题..."
      />

      <div className="rounded-lg border border-slate-200 bg-white">
        {articles.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">暂无文章，点击右上角新增</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">品牌</th>
                <th className="px-4 py-3 font-medium">关联</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">发布时间</th>
                <th className="px-4 py-3 font-medium">排序</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.map((a) => {
                const zh = a.translations.find((tr) => tr.locale === "zh") ?? a.translations[0];
                const bt = Object.fromEntries(a.brand?.translations.map((tr) => [tr.locale, tr]) ?? []);
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="max-w-[280px] px-4 py-3">
                      <div className="truncate font-medium text-slate-800">{zh?.title ?? "(无标题)"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          TYPE_BADGE[a.type] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {TYPE_LABEL[a.type] ?? a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{bt["zh"]?.name ?? "通用"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.pdfLinks.map((l) => (
                          <span
                            key={l.id}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              l.pdfMode === "lead"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {l.pdfMode === "lead" ? "📄 获客" : "📄 下载"}
                          </span>
                        ))}
                        {a.productLinks.map((l) => (
                          <span
                            key={l.id}
                            className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700"
                          >
                            🛒 {l.product?.model ?? "商品"}
                          </span>
                        ))}
                        {a.pdfLinks.length === 0 && a.productLinks.length === 0 && (
                          <span className="text-slate-300">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {a.isPublished ? "已发布" : "草稿"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(a.publishedAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{a.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/support-articles/${a.id}/edit`}
                          className="text-sky-600 hover:underline"
                        >
                          编辑
                        </Link>
                        <DeleteSupportArticleButton id={a.id} />
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
