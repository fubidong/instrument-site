import Link from "next/link";
import { db } from "@/lib/db";
import DeleteDocumentButton from "./delete-document-button";
import ListFilterBar from "@/components/admin/list-filter-bar";

const DOC_TYPE_LABEL: Record<string, string> = {
  datasheet: "数据手册",
  user_manual: "用户手册",
  programming_manual: "编程手册",
  quick_guide: "快速指南",
  service_manual: "服务手册",
  application_note: "应用笔记",
  other: "其他",
};
const LANG_LABEL: Record<string, string> = {
  zh: "中文",
  en: "EN",
  ru: "RU",
  other: "其他",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; lang?: string; brand?: string; q?: string }>;
}) {
  const { type, lang, brand, q } = await searchParams;

  const where: any = {};
  if (type && type !== "all") where.docType = type;
  if (lang && lang !== "all") where.language = lang;
  if (brand && brand !== "all") where.brandId = brand;
  if (q?.trim()) where.title = { contains: q.trim(), mode: "insensitive" };

  const [docs, brands] = await Promise.all([
    db.document.findMany({
      where,
      include: {
        brand: { include: { translations: true } },
        productLine: { include: { translations: true } },
        product: { include: { translations: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.brand.findMany({
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const brandOptions = brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return { id: b.id, label: t["zh"]?.name ?? b.code };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">资料管理</h1>
          <p className="mt-1 text-sm text-slate-500">共 {docs.length} 个资料</p>
        </div>
        <Link
          href="/admin/documents/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          + 新增资料
        </Link>
      </div>

      {/* 筛选栏 */}
      <ListFilterBar
        basePath="/admin/documents"
        fields={[
          {
            key: "type",
            label: "全部类型",
            options: Object.entries(DOC_TYPE_LABEL).map(([v, l]) => ({ value: v, label: l })),
          },
          {
            key: "lang",
            label: "全部语言",
            options: Object.entries(LANG_LABEL).map(([v, l]) => ({ value: v, label: l })),
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
        {docs.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">暂无资料，点击右上角新增</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">语言</th>
                <th className="px-4 py-3 font-medium">品牌</th>
                <th className="px-4 py-3 font-medium">系列</th>
                <th className="px-4 py-3 font-medium">产品</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((d) => {
                const bt = Object.fromEntries(d.brand?.translations.map((tr) => [tr.locale, tr]) ?? []);
                const lt = Object.fromEntries(
                  d.productLine?.translations.map((tr) => [tr.locale, tr]) ?? []
                );
                const pt = Object.fromEntries(d.product?.translations.map((tr) => [tr.locale, tr]) ?? []);
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <a
                        href={d.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 hover:underline"
                      >
                        {d.title}
                      </a>
                      {d.version && (
                        <span className="ml-1 text-xs text-slate-400">v{d.version}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {DOC_TYPE_LABEL[d.docType] ?? d.docType}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{LANG_LABEL[d.language] ?? d.language}</td>
                    <td className="px-4 py-3 text-slate-700">{bt["zh"]?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{lt["zh"]?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{pt["zh"]?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {d.isActive ? "启用" : "停用"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/documents/${d.id}/edit`}
                          className="text-sky-600 hover:underline"
                        >
                          编辑
                        </Link>
                        <DeleteDocumentButton id={d.id} />
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
