import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import { getSiteSettings } from "@/lib/site";
import { filterTabContentBySeries } from "@/lib/tab-filter";
import { routing } from "@/i18n/routing";
import CompareBar from "@/components/compare-bar";
import ProductGallery from "@/components/product-gallery";
import ProductDetailTabs, { type ParamGroup } from "@/components/product-detail-tabs";
import ProductOverview from "@/components/product-overview";

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
          documents: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
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
    const cur: { parentId: string | null } | null = await db.category.findUnique({
      where: { id: curCatId },
      select: { parentId: true },
    });
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

  // 站点设置（联系电话等）
  const settings = await getSiteSettings(locale);

  // 文档合并：产品级 + 系列级（系列共享手册）
  const allDocs = [...product.documents, ...(product.productLine.documents ?? [])];
  const seen = new Set<string>();
  const mergedDocs = allDocs.filter((d) => {
    const k = d.title + "|" + d.filePath;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  // 产品规格手册 PDF：只显示 datasheet（数据表），不显示用户手册
  const productDsPdfs = product.documents.filter((d) => d.docType === "datasheet" && /\.pdf$/i.test(d.filePath));
  const dsPdfs = mergedDocs.filter((d) => d.docType === "datasheet" && /\.pdf$/i.test(d.filePath));
  const pdfSource = productDsPdfs.length > 0 ? productDsPdfs : dsPdfs;
  const pdfs = pdfSource
    .sort((a, b) => {
      const rank = (x: any) => (/^https?:\/\//i.test(x.filePath) ? 1 : 0);
      return rank(a) - rank(b);
    })
    .map((d) => ({ id: d.id, title: d.title, filePath: d.filePath, docType: d.docType }));
  // 资料下载选项卡：全部手册（datasheet + 编程手册 + 用户手册 + 应用笔记等）
  const downloads = mergedDocs
    .filter((d) => {
      if (!["datasheet", "programming_manual", "user_manual", "application_note", "service_manual", "quick_guide"].includes(d.docType)) return false;
      return true;
    })
    .sort((a, b) => (a.docType === "datasheet" ? -1 : 0) - (b.docType === "datasheet" ? -1 : 0))
    .map((d) => ({ id: d.id, title: d.title, filePath: d.filePath, docType: d.docType }));

  // 产品选型内容（中英）
  const selection = pt[locale]?.selection ?? pt["zh"]?.selection ?? null;

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

  // 重点参数：优先取核心卖点(isHighlight，完整显示)，否则取所有有值参数前 6 个
  let highlights = grouped
    .flatMap((g) => g.items)
    .filter((it) => it.isHighlight);
  if (highlights.length === 0) {
    highlights = grouped
      .flatMap((g) => g.items)
      .filter((it) => it.value && it.value !== "-")
      .slice(0, 6);
  }

  // 选项卡参数分组
  const paramGroups: ParamGroup[] = grouped.map((g) => ({
    groupName: g.groupName || g.groupCode,
    items: g.items.map((it) => ({ name: it.name, zhName: it.zhName, value: it.value, unit: it.unit })),
  }));

  // 回退：无结构化参数值时，从 specsOverview（"参数名行+值行"或"参数名：值"）生成参数表
  if (paramGroups.length === 0) {
    const isNameOnly = (l: string) => {
      if (!l) return false;
      if (l.includes("：") || l.includes(":")) return false;
      if (/\d/.test(l)) return false;
      if (/Hz|kHz|MHz|GHz|Ω|µA|uA|mA|mV|µF|uF|pF|nF|mF|kH|µH|uH|mH|%|°|dB|V/.test(l)) return false;
      return l.length <= 40;
    };
    const spec = pt[locale]?.specsOverview ?? pt["zh"]?.specsOverview ?? "";
    const rawLines = (spec ?? "").split("\n").map((l: string) => l.trim()).filter(Boolean);
    const lines: { name: string; value: string }[] = [];
    let pendingName = "";
    let pendingVals: string[] = [];
    for (const l of rawLines) {
      const idx = l.indexOf("：");
      if (idx > 0) {
        if (pendingName) { lines.push({ name: pendingName, value: pendingVals.join(" / ") }); pendingName = ""; pendingVals = []; }
        lines.push({ name: l.slice(0, idx), value: l.slice(idx + 1) });
        continue;
      }
      if (isNameOnly(l)) {
        if (pendingName) { lines.push({ name: pendingName, value: pendingVals.join(" / ") }); }
        pendingName = l;
        pendingVals = [];
        continue;
      }
      if (pendingName) {
        pendingVals.push(l);
      } else if (lines.length && lines[lines.length - 1].name === "") {
        lines[lines.length - 1].value += " / " + l;
      } else {
        lines.push({ name: "", value: l });
      }
    }
    if (pendingName) lines.push({ name: pendingName, value: pendingVals.join(" / ") });
    if (lines.length > 0) paramGroups.push({ groupName: "技术参数", items: lines });
  }

  // 品类自定义选项卡
  const customTabs = productTabs.map((tab) => {
    const tr = tab.translations.find((x) => x.locale === locale) ?? tab.translations.find((x) => x.locale === "zh");
    return {
      code: tab.code,
      title: tr?.title ?? tab.code,
      content: filterTabContentBySeries(tr?.content ?? "", product.productLine.code),
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

      {/* 顶部两栏：左主图 + 右产品概览 */}
      <div className="flex flex-col gap-8 md:flex-row">
        {/* 左：主图（580x580） */}
        <div className="w-full md:w-[580px] md:shrink-0">
          <ProductGallery
            coverImage={product.coverImage}
            images={product.images}
            alt={pt[locale]?.name ?? pt["zh"]?.name ?? product.model}
            noImageText={I.noImage}
          />
        </div>

        {/* 右：产品概览（标题/属性标签/简介/关键参数/联系方式/按钮组） */}
        <ProductOverview
          locale={locale}
          isEn={isEn}
          model={product.model}
          name={pt[locale]?.name ?? pt["zh"]?.name ?? product.model}
          brand={bt[locale]?.name ?? bt["zh"]?.name ?? product.productLine.brand.code}
          series={lt[locale]?.name ?? lt["zh"]?.name ?? product.productLine.code}
          summary={pt[locale]?.summary ?? pt["zh"]?.summary ?? null}
          highlights={highlights}
          phone={settings.phone || undefined}
          phoneEnabled={settings.phoneEnabled}
          productId={product.id}
          productModel={product.model}
          productName={pt[locale]?.name ?? pt["zh"]?.name ?? product.model}
          isSampleEnabled={product.isSampleEnabled}
        />
      </div>

      {/* 选项卡：产品介绍 / 技术参数 / 产品选型 / 产品规格手册 / 品类自定义 */}
      <div className="mt-10">
        <ProductDetailTabs
          intro={pt[locale]?.description ?? pt["zh"]?.description ?? null}
          highlights={highlights.map((h) => ({ name: h.name, value: h.value, unit: h.unit }))}
          paramGroups={paramGroups}
          selection={selection}
          pdfs={pdfs}
          downloads={downloads}
          customTabs={customTabs}
          specsHtml={((): string | null => {
            const s = (pt[locale]?.specsOverview ?? pt["zh"]?.specsOverview ?? "").trim();
            return s && s.startsWith("<") ? s : null;
          })()}
          labels={{
            intro: I.intro,
            params: I.params,
            selection: isEn ? "Product Selection" : "产品选型",
            manual: isEn ? "Product Specifications" : "产品规格",
            download: isEn ? "Download PDF" : "下载 PDF",
            downloads: isEn ? "Downloads" : "资料下载",
            highlight: I.highlights,
            noParams: I.noParams,
            noTabContent: isEn
              ? "No content available for this series yet. Contact us for selection support."
              : "该系列暂无相关内容，欢迎联系我们获取选型支持",
          }}
        />
      </div>

      <CompareBar locale={locale} />
    </div>
  );
}
