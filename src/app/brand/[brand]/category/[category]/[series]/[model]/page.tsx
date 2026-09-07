import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBrand, getBrandCategories, getBrandModel } from "@/lib/brand";
import { getBrandLocale, brandPath } from "@/lib/brand-locale";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/site";
import { filterTabContentBySeries } from "@/lib/tab-filter";
import ProductGallery from "@/components/product-gallery";
import ProductDetailTabs, { type ParamGroup } from "@/components/product-detail-tabs";
import ProductOverview from "@/components/product-overview";
import CompareBar from "@/components/compare-bar";

export default async function BrandModelPage({
  params,
}: {
  params: Promise<{ brand: string; category: string; series: string; model: string }>;
}) {
  const { brand: brandCode, category: catCode, series: seriesCode, model: modelName } = await params;
  const locale = await getBrandLocale();
  setRequestLocale(locale);
  const isEn = locale === "en";

  const brand = await getBrand(brandCode);
  if (!brand || !brand.isActive) notFound();
  const brandName = brand.name[locale]?.name ?? brand.name["zh"]?.name ?? brand.code;
  const base = brandPath(brand.code, locale);

  const categories = await getBrandCategories(brand.id, locale);
  const cat = categories.find((c) => c.code.toLowerCase() === catCode.toLowerCase());
  if (!cat) notFound();

  const product = await getBrandModel(brand.id, decodeURIComponent(modelName));
  if (!product) notFound();

  // 品类自定义选项卡（沿分类树向上找，子分类继承父分类选项卡）
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

  // 站点设置（联系电话等）
  const settings = await getSiteSettings(isEn ? "en" : "zh");

  // 产品规格手册 PDF（datasheet 优先）+ 申请样机开关
  const productMeta = await db.product.findUnique({
    where: { id: product.id },
    include: {
      documents: { where: { isActive: true } },
      productLine: { include: { documents: { where: { isActive: true } } } },
    },
  });
  const allDocs = [...(productMeta?.documents ?? []), ...(productMeta?.productLine?.documents ?? [])];
  const seen = new Set<string>();
  const mergedDocs = allDocs.filter((d) => {
    const k = d.title + "|" + d.filePath;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  // 产品规格手册 PDF：优先产品级自选规格书（后台"产品规格书"），无则回退系列 datasheet
  const productDsPdfs = (productMeta?.documents ?? []).filter((d) => d.docType === "datasheet" && /\.pdf$/i.test(d.filePath));
  const dsPdfs = mergedDocs.filter((d) => d.docType === "datasheet" && /\.pdf$/i.test(d.filePath));
  const pdfSource = productDsPdfs.length > 0 ? productDsPdfs : dsPdfs;
  const pdfs = (pdfSource.length > 0 ? pdfSource : mergedDocs.filter((d) => /\.pdf$/i.test(d.filePath)))
    .sort((a, b) => {
      const rank = (x: any) => (/^https?:\/\//i.test(x.filePath) ? 1 : 0);
      return rank(a) - rank(b);
    })
    .map((d) => ({ id: d.id, title: d.title, filePath: d.filePath, docType: d.docType }));
  const lineCode2 = productMeta?.productLine?.code ?? "";
  const normKey2 = (s: string) => s.toLowerCase().replace(/[\s\-_/+]/g, "");
  const downloads = mergedDocs
    .filter((d) => {
      if (!["datasheet", "programming_manual", "user_manual", "application_note"].includes(d.docType)) return false;
      if (d.docType === "user_manual") return normKey2(d.title).includes(normKey2(lineCode2));
      return true;
    })
    .sort((a, b) => (a.docType === "datasheet" ? -1 : 0) - (b.docType === "datasheet" ? -1 : 0))
    .map((d) => ({ id: d.id, title: d.title, filePath: d.filePath, docType: d.docType }));
  const isSampleEnabled = productMeta?.isSampleEnabled ?? false;

  // 解析 specsOverview 为参数表
  const pt = isEn ? product.en : product.zh;
  const specLines = (pt?.specsOverview ?? "")
    .split("\n")
    .filter((l: string) => l.trim())
    .map((l: string) => {
      const idx = l.indexOf("：");
      if (idx > 0) return { name: l.slice(0, idx), value: l.slice(idx + 1) };
      return { name: "", value: l };
    });

  // 重点参数：优先 isHighlight（完整显示），否则取前 4 个参数值
  const pvList = (product.paramValues as any[]) ?? [];
  let highlights = pvList
    .filter((pv) => pv.isHighlight === true)
    .map((pv) => {
      const name =
        pv.paramDefinition.translations.find((tr: any) => tr.locale === "zh")?.name ??
        pv.paramDefinition.key;
      const enName =
        pv.paramDefinition.translations.find((tr: any) => tr.locale === "en")?.name ?? name;
      const value =
        pv.valueString ??
        (pv.valueBoolean !== null && pv.valueBoolean !== undefined
          ? pv.valueBoolean
            ? isEn
              ? "Yes"
              : "支持"
            : isEn
              ? "No"
              : "不支持"
          : pv.valueNumber !== null && pv.valueNumber !== undefined
            ? String(pv.valueNumber)
            : "-");
      const unit = pv.paramDefinition.unit ?? "";
      return { name: isEn ? enName : name, value, unit };
    });
  if (highlights.length === 0) {
    highlights = pvList
      .slice(0, 6)
      .map((pv) => {
        const name =
          pv.paramDefinition.translations.find((tr: any) => tr.locale === "zh")?.name ??
          pv.paramDefinition.key;
        const enName =
          pv.paramDefinition.translations.find((tr: any) => tr.locale === "en")?.name ?? name;
        const value =
          pv.valueString ??
          (pv.valueBoolean !== null && pv.valueBoolean !== undefined
            ? pv.valueBoolean
              ? isEn
                ? "Yes"
                : "支持"
              : isEn
                ? "No"
                : "不支持"
            : pv.valueNumber !== null && pv.valueNumber !== undefined
              ? String(pv.valueNumber)
              : "-");
        const unit = pv.paramDefinition.unit ?? "";
        return { name: isEn ? enName : name, value, unit };
      });
  }

  // 技术参数：specsOverview 单组
  const paramGroups: ParamGroup[] =
    specLines.length > 0
      ? [{ groupName: isEn ? "Specifications" : "技术参数", items: specLines.map((r: any) => ({ name: r.name, value: r.value })) }]
      : [];

  // 品类自定义选项卡
  const customTabs = productTabs.map((tab) => {
    const tr = tab.translations.find((x) => x.locale === locale) ?? tab.translations.find((x) => x.locale === "zh");
    return { code: tab.code, title: tr?.title ?? tab.code, content: filterTabContentBySeries(tr?.content ?? "", product.series) };
  });

  const I = {
    intro: isEn ? "Overview" : "产品介绍",
    specs: isEn ? "Specifications" : "技术参数",
    noParams: isEn ? "No specifications available" : "暂无参数信息",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* 面包屑 */}
      <div className="mb-6 text-sm text-slate-500">
        <Link href={base} className="hover:text-sky-600">{brandName}</Link>
        <span className="mx-2">/</span>
        <Link href={`${base}/category/${cat.code.toLowerCase()}`} className="hover:text-sky-600">
          {cat.name}
        </Link>
        <span className="mx-2">/</span>
        <Link href={`${base}/category/${cat.code.toLowerCase()}/${encodeURIComponent(product.series)}`} className="hover:text-sky-600">
          {product.seriesName}
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
            alt={product.model}
            noImageText={isEn ? "No image" : "无图"}
          />
        </div>

        {/* 右：产品概览（标题/属性标签/简介/关键参数/联系方式/按钮组） */}
        <ProductOverview
          locale={isEn ? "en" : "zh"}
          isEn={isEn}
          model={product.model}
          name={pt?.name ?? product.model}
          brand={brandName}
          series={product.seriesName}
          summary={pt?.summary ?? null}
          highlights={highlights}
          phone={settings.phone || undefined}
          phoneEnabled={settings.phoneEnabled}
          productId={product.id}
          productModel={product.model}
          productName={pt?.name ?? product.model}
          isSampleEnabled={isSampleEnabled}
        />
      </div>

      {/* 选项卡：产品介绍 / 技术参数 / 产品选型 / 产品规格手册 / 品类自定义 */}
      <div className="mt-10">
        <ProductDetailTabs
          intro={pt?.description ?? null}
          highlights={highlights}
          paramGroups={paramGroups}
          selection={pt?.selection ?? null}
          pdfs={pdfs}
          downloads={downloads}
          customTabs={customTabs}
          labels={{
            intro: I.intro,
            params: I.specs,
            selection: isEn ? "Product Selection" : "产品选型",
            manual: isEn ? "Product Specifications" : "产品规格",
            download: isEn ? "Download PDF" : "下载 PDF",
            downloads: isEn ? "Downloads" : "资料下载",
            noParams: I.noParams,
            noTabContent: isEn
              ? "No content available for this series yet. Contact us for selection support."
              : "该系列暂无相关内容，欢迎联系我们获取选型支持",
          }}
        />
      </div>

      <CompareBar locale={isEn ? "en" : "zh"} />
    </div>
  );
}
