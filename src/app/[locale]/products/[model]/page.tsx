import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import { routing } from "@/i18n/routing";
import InquiryForm from "../../contact/inquiry-form";
import CompareBar from "./compare-bar";
import ProductGallery from "@/components/product-gallery";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; model: string }>;
}) {
  const { locale, model } = await params;
  const p = await db.product.findUnique({
    where: { model: decodeURIComponent(model) },
    include: { translations: true, productLine: { include: { brand: { include: { translations: true } } } } },
  });
  if (!p) return {};
  const pt = Object.fromEntries(p.translations.map((tr) => [tr.locale, tr]));
  const bt = Object.fromEntries(p.productLine.brand.translations.map((tr) => [tr.locale, tr]));
  return {
    title: `${p.model} - ${pt[locale]?.name ?? pt["zh"]?.name ?? ""}`,
    description: pt[locale]?.summary ?? pt["zh"]?.summary ?? `${p.model} 详细技术参数`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; model: string }>;
}) {
  const { locale, model } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
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

  const grouped: { groupCode: string; groupName: string; items: any[] }[] = [];
  const groupMap = new Map<string, typeof grouped[0]>();
  for (const pv of product.paramValues) {
    const def = pv.paramDefinition;
    const dt = Object.fromEntries(def.translations.map((tr) => [tr.locale, tr]));
    let groupKey = def.paramGroupId;
    let groupName = "";
    if (def.paramGroup?.translations) {
      const gt = Object.fromEntries(def.paramGroup.translations.map((tr) => [tr.locale, tr]));
      groupName = gt[locale]?.name ?? gt["zh"]?.name ?? "";
    }
    if (!groupMap.has(groupKey)) {
      const entry = { groupCode: groupKey, groupName, items: [] as any[] };
      groupMap.set(groupKey, entry);
      grouped.push(entry);
    }
    let value: string;
    if (pv.valueBoolean !== null && pv.valueBoolean !== undefined)
      value = pv.valueBoolean ? (isEn ? "Yes" : "支持") : isEn ? "No" : "不支持";
    else if (pv.valueNumber !== null && pv.valueNumber !== undefined)
      value = String(pv.valueNumber);
    else if (pv.valueMin !== null || pv.valueMax !== null)
      value = `${pv.valueMin ?? "?"} ~ ${pv.valueMax ?? "?"}`;
    else value = pv.valueString ?? "-";
    const unit = dt[locale]?.unit ?? dt["zh"]?.unit ?? def.unit ?? "";
    groupMap.get(groupKey)!.items.push({
      zhName: dt["zh"]?.name ?? def.key,
      name: dt[locale]?.name ?? dt["zh"]?.name ?? def.key,
      value,
      unit,
      isHighlight: pv.isHighlight === true,
    });
  }

  const I = {
    home: isEn ? "Home" : "首页",
    products: isEn ? "Products" : "产品中心",
    brand: isEn ? "Brand" : "品牌",
    series: isEn ? "Series" : "系列",
    model: isEn ? "Model" : "型号",
    noImage: isEn ? "No image" : "暂无图片",
    highlights: isEn ? "Key Highlights" : "核心卖点",
    params: isEn ? "Technical Specifications" : "技术参数",
    documents: isEn ? "Downloads" : "资料下载",
    noParams: isEn ? "No specifications available" : "暂无参数信息",
    download: isEn ? "Download" : "下载",
    highlight: isEn ? "Feature" : "卖点",
  };

  const docTypeLabel: Record<string, string> = {
    datasheet: isEn ? "Datasheet" : "数据手册",
    user_manual: isEn ? "User Manual" : "用户手册",
    programming_manual: isEn ? "Programming Manual" : "编程手册",
    quick_guide: isEn ? "Quick Guide" : "快速指南",
    service_manual: isEn ? "Service Manual" : "服务手册",
    application_note: isEn ? "Application Note" : "应用笔记",
    other: isEn ? "Other" : "其他",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-sky-600">
          {I.home}
        </Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-sky-600">
          {I.products}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{product.model}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProductGallery
            coverImage={product.coverImage}
            images={product.images}
            alt={pt[locale]?.name ?? pt["zh"]?.name ?? product.model}
            noImageText={I.noImage}
          />

          <div className="mt-4">
            <InquiryForm
              locale={locale}
              productId={product.id}
              productModel={product.model}
              productName={pt[locale]?.name ?? pt["zh"]?.name ?? product.model}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{product.model}</h1>
                <div className="mt-1 text-lg text-slate-600">
                  {pt[locale]?.name ?? pt["zh"]?.name}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {pt[locale === "zh" ? "en" : "zh"]?.name}
                </div>
              </div>
              <div className="text-right text-sm text-slate-500">
                <div>
                  {I.brand}：{bt[locale]?.name ?? bt["zh"]?.name ?? product.productLine.brand.code}
                </div>
                <div>
                  {I.series}：{lt[locale]?.name ?? lt["zh"]?.name ?? product.productLine.code}
                </div>
                <div>
                  {I.model}：{product.sku ?? product.model}
                </div>
              </div>
            </div>
            {pt[locale]?.summary && (
              <p className="mt-4 rounded-md bg-sky-50 p-3 text-sm text-slate-700">
                {pt[locale].summary}
              </p>
            )}

            {grouped.some((g) => g.items.some((it) => it.isHighlight)) && (
              <div className="mt-5">
                <div className="mb-2 text-sm font-semibold text-slate-800">{I.highlights}</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {grouped.flatMap((g) =>
                    g.items
                      .filter((it) => it.isHighlight)
                      .map((it, idx) => (
                        <div
                          key={`${g.groupCode}-${idx}`}
                          className="flex items-center justify-between rounded-md bg-rose-50 px-3 py-2"
                        >
                          <span className="text-sm text-slate-600">{it.name}</span>
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

          <div className="mt-6">
            <h2 className="mb-3 text-lg font-bold text-slate-900">{I.params}</h2>
            <div className="space-y-4">
              {grouped.map((g) => (
                <div key={g.groupCode} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="bg-slate-50 px-4 py-2">
                    <span className="text-sm font-semibold text-slate-700">{g.groupName}</span>
                  </div>
                  <table className="w-full bg-white text-sm">
                    <tbody>
                      {g.items.map((it, idx) => (
                        <tr key={idx} className={it.isHighlight ? "bg-rose-50/50" : "border-t border-slate-100"}>
                          <td className="w-1/3 px-4 py-2.5 text-slate-500">
                            {it.name}
                            {it.zhName && it.name !== it.zhName && (
                              <span className="ml-1 text-xs text-slate-300">{it.zhName}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-800">
                            {it.value}
                            {it.unit && <span className="ml-1 text-xs text-slate-400">{it.unit}</span>}
                            {it.isHighlight && (
                              <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-600">
                                {I.highlight}
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
                  {I.noParams}
                </div>
              )}
            </div>
          </div>

          {product.documents.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-bold text-slate-900">{I.documents}</h2>
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
                    <span className="text-sm text-sky-600">{I.download} →</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CompareBar locale={locale} productId={product.id} productModel={product.model} />
    </div>
  );
}
