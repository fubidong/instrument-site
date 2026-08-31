import Link from "next/link";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import DocumentFilters from "./document-filters";

export const metadata = { title: "资料下载" };

const docTypes = [
  { value: "datasheet", label: "数据手册" },
  { value: "user_manual", label: "用户手册" },
  { value: "programming_manual", label: "编程手册" },
  { value: "quick_guide", label: "快速指南" },
  { value: "service_manual", label: "服务手册" },
  { value: "application_note", label: "应用笔记" },
  { value: "other", label: "其他" },
];

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; brand?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const where: any = { isActive: true };
  if (sp.type) where.docType = sp.type;
  if (sp.brand) where.brandId = sp.brand;
  if (sp.q?.trim()) {
    where.OR = [{ title: { contains: sp.q.trim(), mode: "insensitive" } }];
  }

  const [documents, brands] = await Promise.all([
    db.document.findMany({
      where,
      include: {
        brand: { include: { translations: true } },
        productLine: { include: { translations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.brand.findMany({
      where: { isActive: true },
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const typeLabel = (v: string) => docTypes.find((d) => d.value === v)?.label ?? v;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">资料下载</h1>
      <p className="mt-2 text-slate-500">
        产品数据手册、用户手册、应用笔记等资料，助您快速了解与使用产品。
      </p>

      <DocumentFilters
        docTypes={docTypes}
        brands={brands.map((b) => ({
          id: b.id,
          code: b.code,
          zhName: t(b.translations, "zh", "name") || b.code,
        }))}
        currentType={sp.type}
        currentBrand={sp.brand}
        currentQ={sp.q ?? ""}
      />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => {
          const bt = Object.fromEntries(doc.brand?.translations.map((tr) => [tr.locale, tr]) ?? []);
          const lt = Object.fromEntries(doc.productLine?.translations.map((tr) => [tr.locale, tr]) ?? []);
          return (
            <a
              key={doc.id}
              href={doc.filePath}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-sky-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-800">{doc.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">
                      {typeLabel(doc.docType)}
                    </span>
                    {doc.language === "en" && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">EN</span>
                    )}
                    {doc.language === "ru" && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">RU</span>
                    )}
                    {doc.version && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        v{doc.version}
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-sky-600">↓</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {bt["zh"]?.name ?? ""}
                {lt["zh"]?.name ? ` · ${lt["zh"].name}` : ""}
              </div>
            </a>
          );
        })}
      </div>

      {documents.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center text-slate-400">
          暂无资料
        </div>
      )}
    </div>
  );
}
