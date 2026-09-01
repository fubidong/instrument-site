import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import { routing } from "@/i18n/routing";
import CompareBar, { CompareToggle } from "@/components/compare-bar";
import ProductGallery from "@/components/product-gallery";
import ProductDetailTabs, { type ParamGroup } from "@/components/product-detail-tabs";
import LeadDialog from "@/components/lead-dialog";

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

  // 品类自定义选项卡（不同品类显示不同选项卡；沿分类树向上找，子分类继承父分类选项卡）
  const ancestors: string[] = [];
  let curCatId: string | null = product.categoryId;
  while (curCatId) {
    ancestors.push(curCatId);
    const cur = await db.category.findUnique({ where: { id: curCatId }, select: { parentId: true } });
    if (!cur) break;
    curCatId = cur.parentId;
  }
  const productTabs = await db.productTab.findMany({
    where: { categoryId: { in: ancestors }, isActive: true },
    include: { translations: true },
    orderBy: { sortOrder: "asc" },
  });

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

  // 重点参数（3-4 个）：优先取核心卖点(isHighlight)，否则取每组第一个
  let highlights = grouped
    .flatMap((g) => g.items)
    .filter((it) => it.isHighlight)
    .slice(0, 4);
  if (highlights.length === 0) {
    highlights = grouped
      .map((g) => g.items[0])
      .filter(Boolean)
      .slice(0, 4);
  }

  // 选项卡参数分组
  const paramGroups: ParamGroup[] = grouped.map((g) => ({
    groupName: g.groupName || g.groupCode,
    items: g.items.map((it) => ({ name: it.name, zhName: it.zhName, value: it.value, unit: it.unit })),
  }));

  // 品类自定义选项卡
  const customTabs = productTabs.map((tab) => {
    const tr = tab.translations.find((x) => x.locale === locale) ?? tab.translations.find((x) => x.locale === "zh");
    return {
      code: tab.code,
      title: tr?.title ?? tab.code,
      content: tr?.content ?? "",
    };
  });

  const I = {
    home: isEn ? "Home" : "首页",
    products: isEn ? "Products" : "产品中心",
    brand: isEn ? "Brand" : "品牌",
    series: isEn ? "Series" : "系列",
    model: isEn ? "Model" : "型号",
    noImage: isEn ? "No image" : "暂无图片",
    highlights: isEn ? "Key Highlights" : "核心卖点",
    intro: isEn ? "Overview" : "产品介绍",
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
      {/* 面包屑 */}
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

      {/* 顶部两栏：左主图 + 右产品简介 */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* 左：主图（580x580） */}
        <div className="w-full lg:w-[580px] lg:shrink-0">
          <ProductGallery
            coverImage={product.coverImage}
            images={product.images}
            alt={pt[locale]?.name ?? pt["zh"]?.name ?? product.model}
            noImageText={I.noImage}
          />
        </div>

        {/* 右：产品简介 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-sky-600">
              {bt[locale]?.name ?? bt["zh"]?.name ?? product.productLine.brand.code}
            </span>
            <span>·</span>
            <span>{lt[locale]?.name ?? lt["zh"]?.name ?? product.productLine.code}</span>
          </div>
          <h1 className="mt-2 font-mono text-3xl font-bold text-slate-900">{product.model}</h1>
          <div className="mt-1 text-lg text-slate-600">
            {pt[locale]?.name ?? pt["zh"]?.name}
          </div>
          {pt[locale]?.summary && (
            <p className="mt-4 text-sm leading-6 text-slate-600">{pt[locale].summary}</p>
          )}

          {/* 重点参数（3-4 个） */}
          {highlights.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {highlights.map((h, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                    {h.name}
                  </div>
                  <div className="mt-1 truncate text-lg font-bold text-slate-800">
                    {h.value}
                    {h.unit && <span className="ml-0.5 text-xs font-normal text-slate-400">{h.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 操作按钮组 */}
          <div className="mt-7 flex flex-wrap gap-3">
            <LeadDialog
              type="inquiry"
              locale={locale}
              productId={product.id}
              productModel={product.model}
              productName={pt[locale]?.name ?? pt["zh"]?.name ?? product.model}
            />
            {product.isSampleEnabled && (
              <LeadDialog
                type="sample"
                locale={locale}
                productId={product.id}
                productModel={product.model}
                productName={pt[locale]?.name ?? pt["zh"]?.name ?? product.model}
              />
            )}
            <CompareToggle
              locale={locale}
              productId={product.id}
              productModel={product.model}
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-sky-400 hover:text-sky-600"
            />
          </div>

          {/* 型号信息 */}
          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">{I.brand}</span>
              <span className="font-medium text-slate-700">
                {bt[locale]?.name ?? bt["zh"]?.name ?? product.productLine.brand.code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{I.series}</span>
              <span className="font-medium text-slate-700">
                {lt[locale]?.name ?? lt["zh"]?.name ?? product.productLine.code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{I.model}</span>
              <span className="font-medium text-slate-700">{product.sku ?? product.model}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 选项卡：产品介绍 / 技术参数 / 品类自定义 */}
      <div className="mt-10">
        <ProductDetailTabs
          intro={pt[locale]?.description ?? pt["zh"]?.description ?? null}
          highlights={highlights.map((h) => ({ name: h.name, value: h.value, unit: h.unit }))}
          paramGroups={paramGroups}
          customTabs={customTabs}
          labels={{ intro: I.intro, params: I.params, highlight: I.highlights, noParams: I.noParams }}
        />
      </div>

      {/* 资料下载 */}
      {product.documents.length > 0 && (
        <div className="mt-8">
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

      <CompareBar locale={locale} productId={product.id} productModel={product.model} />
    </div>
  );
}
