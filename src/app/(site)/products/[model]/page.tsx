import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import InquiryForm from "../../contact/inquiry-form";
import CompareBar from "./compare-bar";

export const metadata = { title: "产品详情" };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const decoded = decodeURIComponent(model);

  const product = await db.product.findUnique({
    where: { model: decoded },
    include: {
      translations: true,
      productLine: {
        include: {
          translations: true,
          brand: { include: { translations: true } },
        },
      },
      images: { orderBy: { sortOrder: "asc" } },
      documents: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
      paramValues: {
        include: {
          paramDefinition: {
            include: {
              translations: true,
              paramGroup: { include: { translations: true } },
            },
          },
        },
        orderBy: { paramDefinition: { sortOrder: "asc" } },
      },
    },
  });
  if (!product || !product.isActive) notFound();

  const pt = Object.fromEntries(product.translations.map((tr) => [tr.locale, tr]));
  const bt = Object.fromEntries(product.productLine.brand.translations.map((tr) => [tr.locale, tr]));
  const lt = Object.fromEntries(product.productLine.translations.map((tr) => [tr.locale, tr]));

  // 按分组整理参数
  const grouped: { groupCode: string; groupZh: string; groupEn: string; items: any[] }[] = [];
  const groupMap = new Map<string, typeof grouped[0]>();
  for (const pv of product.paramValues) {
    const def = pv.paramDefinition;
    const dt = Object.fromEntries(def.translations.map((tr) => [tr.locale, tr]));
    let groupKey = def.paramGroupId;
    let groupZh = "";
    let groupEn = "";
    if (def.paramGroup?.translations) {
      const gt = Object.fromEntries(
        def.paramGroup.translations.map((tr) => [tr.locale, tr])
      );
      groupZh = gt["zh"]?.name ?? "";
      groupEn = gt["en"]?.name ?? "";
    }
    if (!groupMap.has(groupKey)) {
      const entry = { groupCode: groupKey, groupZh, groupEn, items: [] as any[] };
      groupMap.set(groupKey, entry);
      grouped.push(entry);
    }
    let value: string;
    if (pv.valueBoolean !== null && pv.valueBoolean !== undefined) value = pv.valueBoolean ? "支持" : "不支持";
    else if (pv.valueNumber !== null && pv.valueNumber !== undefined) value = String(pv.valueNumber);
    else if (pv.valueMin !== null || pv.valueMax !== null) value = `${pv.valueMin ?? "?"} ~ ${pv.valueMax ?? "?"}`;
    else value = pv.valueString ?? "-";
    const unit = dt["en"]?.unit ?? def.unit ?? "";
    groupMap.get(groupKey)!.items.push({
      zhName: dt["zh"]?.name ?? def.key,
      enName: dt["en"]?.name ?? def.key,
      value,
      unit,
      isHighlight: pv.isHighlight === true,
    });
  }

  const docTypeLabel: Record<string, string> = {
    datasheet: "数据手册",
    user_manual: "用户手册",
    programming_manual: "编程手册",
    quick_guide: "快速指南",
    service_manual: "服务手册",
    application_note: "应用笔记",
    other: "其他",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* 面包屑 */}
      <div className="mb-6 text-sm text-slate-500">
        <a href="/" className="hover:text-sky-600">首页</a>
        <span className="mx-2">/</span>
        <a href="/products" className="hover:text-sky-600">产品中心</a>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{product.model}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 左侧：图片 + 概要 */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            {product.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.coverImage}
                alt={pt["zh"]?.name ?? product.model}
                className="mx-auto h-72 w-full object-contain"
              />
            ) : (
              <div className="flex h-72 w-full items-center justify-center rounded bg-slate-50 text-slate-300">
                暂无图片
              </div>
            )}
          </div>
          {product.images.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.imagePath}
                  alt={img.altText ?? product.model}
                  className="h-16 w-full rounded border border-slate-200 object-contain"
                />
              ))}
            </div>
          )}

          {/* 询价表单 */}
          <div className="mt-4">
            <InquiryForm
              productId={product.id}
              productModel={product.model}
              productName={pt["zh"]?.name ?? product.model}
            />
          </div>
        </div>

        {/* 右侧：详情 + 参数 */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{product.model}</h1>
                <div className="mt-1 text-lg text-slate-600">{pt["zh"]?.name}</div>
                <div className="mt-1 text-sm text-slate-400">{pt["en"]?.name}</div>
              </div>
              <div className="text-right text-sm text-slate-500">
                <div>品牌：{bt["zh"]?.name ?? product.productLine.brand.code}</div>
                <div>系列：{lt["zh"]?.name ?? product.productLine.code}</div>
                <div>型号：{product.sku ?? product.model}</div>
              </div>
            </div>
            {pt["zh"]?.summary && (
              <p className="mt-4 rounded-md bg-sky-50 p-3 text-sm text-slate-700">
                {pt["zh"].summary}
              </p>
            )}

            {/* 卖点参数高亮 */}
            {grouped.some((g) => g.items.some((it) => it.isHighlight)) && (
              <div className="mt-5">
                <div className="mb-2 text-sm font-semibold text-slate-800">核心卖点</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {grouped.flatMap((g) =>
                    g.items
                      .filter((it) => it.isHighlight)
                      .map((it, idx) => (
                        <div
                          key={`${g.groupCode}-${idx}`}
                          className="flex items-center justify-between rounded-md bg-rose-50 px-3 py-2"
                        >
                          <span className="text-sm text-slate-600">{it.zhName}</span>
                          <span className="font-semibold text-rose-600">
                            {it.value}
                            {it.unit && <span className="ml-0.5 text-xs">{it.unit}</span>}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 参数表 */}
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-bold text-slate-900">技术参数</h2>
            <div className="space-y-4">
              {grouped.map((g) => (
                <div key={g.groupCode} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="bg-slate-50 px-4 py-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {g.groupZh}
                      {g.groupEn && <span className="ml-2 text-xs font-normal text-slate-400">{g.groupEn}</span>}
                    </span>
                  </div>
                  <table className="w-full bg-white text-sm">
                    <tbody>
                      {g.items.map((it, idx) => (
                        <tr key={idx} className={it.isHighlight ? "bg-rose-50/50" : "border-t border-slate-100"}>
                          <td className="w-1/3 px-4 py-2.5 text-slate-500">
                            {it.zhName}
                            {it.enName && (
                              <span className="ml-1 text-xs text-slate-300">{it.enName}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-800">
                            {it.value}
                            {it.unit && <span className="ml-1 text-xs text-slate-400">{it.unit}</span>}
                            {it.isHighlight && (
                              <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-600">
                                卖点
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              {grouped.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
                  暂无参数信息
                </div>
              )}
            </div>
          </div>

          {/* 资料下载 */}
          {product.documents.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-bold text-slate-900">资料下载</h2>
              <div className="space-y-2">
                {product.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-sky-300"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">{doc.title}</div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {docTypeLabel[doc.docType] ?? doc.docType}
                        {doc.version && ` · v${doc.version}`}
                        {doc.language === "en" && " · EN"}
                        {doc.language === "ru" && " · RU"}
                      </div>
                    </div>
                    <span className="text-sm text-sky-600">下载 →</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CompareBar productId={product.id} productModel={product.model} />
    </div>
  );
}
