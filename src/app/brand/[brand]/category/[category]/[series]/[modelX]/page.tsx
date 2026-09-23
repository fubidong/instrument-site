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
  params: Promise<{ brand: string; category: string; series: string; modelX: string }>;
}) {
  const { brand: brandCode, category: catCode, series: seriesCode, modelX: modelName } = await params;
  const locale = await getBrandLocale();
  setRequestLocale(locale);
  const isEn = locale === "en";

  const brand = await getBrand(brandCode);
  if (!brand || !brand.isActive) notFound();
  const brandName = brand.name[locale]?.name ?? brand.name["zh"]?.name ?? brand.code;
  const base = brandPath(brand.code, locale);
  /** 国仪量子官网风格布局（左图右文大标题+整宽特性块），不影响其他品牌 */
  const isCiq = brand.code === "CIQTEK";

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
    // 去重 key 含语言：同一文件的中/英文两条（同标题同路径不同语言）需同时保留
    const k = d.title + "|" + d.filePath + "|" + (d.language || "");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  // 产品规格手册 PDF：数据手册 + 产品单页(quick_guide)，优先产品级自选规格书，无则回退系列；按当前语言过滤
  const langDoc = (d: any) => !d.language || d.language === (isEn ? "en" : "zh");
  const specDoc = (d: any) => (d.docType === "datasheet" || d.docType === "quick_guide") && /\.pdf$/i.test(d.filePath) && langDoc(d);
  const productDsPdfs = (productMeta?.documents ?? []).filter(specDoc);
  const dsPdfs = mergedDocs.filter(specDoc);
  const pdfSource = productDsPdfs.length > 0 ? productDsPdfs : dsPdfs;
  // 无规格书/单页时回退：所有 PDF 排除用户手册（保证产品规格有内容但不混入说明书）
  const fallbackPdfs = mergedDocs.filter((d) => /\.pdf$/i.test(d.filePath) && langDoc(d) && d.docType !== "user_manual");
  const pdfs = (pdfSource.length > 0 ? pdfSource : fallbackPdfs)
    .sort((a, b) => {
      const rank = (x: any) => (/^https?:\/\//i.test(x.filePath) ? 1 : 0);
      return rank(a) - rank(b);
    })
    .map((d) => ({ id: d.id, title: d.title, filePath: d.filePath, docType: d.docType }));
  const lineCode2 = productMeta?.productLine?.code ?? "";
  const normKey2 = (s: string) => s.toLowerCase().replace(/[\s\-_/+]/g, "");
  const downloads = mergedDocs
    .filter((d) => {
      if (!["datasheet", "quick_guide", "programming_manual", "user_manual", "application_note", "service_manual"].includes(d.docType)) return false;
      if (!langDoc(d)) return false;
      if (d.docType === "user_manual" && !d.productId) return normKey2(d.title).includes(normKey2(lineCode2));
      return true;
    })
    .sort((a, b) => (a.docType === "datasheet" ? -1 : 0) - (b.docType === "datasheet" ? -1 : 0))
    .map((d) => ({ id: d.id, title: d.title, filePath: d.filePath, docType: d.docType }));
  const isSampleEnabled = productMeta?.isSampleEnabled ?? false;

  // 解析 specsOverview 为参数表（兼容"参数名行+值行"与"参数名：值"两种格式）
  const pt = isEn ? product.en : product.zh;
  const isNameOnly = (l: string) => {
    if (!l) return false;
    if (l.includes("：") || l.includes(":")) return false;
    if (/\d/.test(l)) return false;
    if (/Hz|kHz|MHz|GHz|Ω|µA|uA|mA|mV|µF|uF|pF|nF|mF|kH|µH|uH|mH|%|°|dB|V/.test(l)) return false;
    return l.length <= 40;
  };
  const rawLines = (pt?.specsOverview ?? "").split("\n").map((l: string) => l.trim()).filter(Boolean);
  const specLines: { name: string; value: string }[] = [];
  let pendingName = "";
  let pendingVals: string[] = [];
  for (const l of rawLines) {
    const idx = l.indexOf("：");
    if (idx > 0) {
      if (pendingName) { specLines.push({ name: pendingName, value: pendingVals.join(" / ") }); pendingName = ""; pendingVals = []; }
      specLines.push({ name: l.slice(0, idx), value: l.slice(idx + 1) });
      continue;
    }
    if (isNameOnly(l)) {
      if (pendingName) { specLines.push({ name: pendingName, value: pendingVals.join(" / ") }); }
      pendingName = l;
      pendingVals = [];
      continue;
    }
    if (pendingName) {
      pendingVals.push(l);
    } else if (specLines.length && specLines[specLines.length - 1].name === "") {
      specLines[specLines.length - 1].value += " / " + l;
    } else {
      specLines.push({ name: "", value: l });
    }
  }
  if (pendingName) specLines.push({ name: pendingName, value: pendingVals.join(" / ") });

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

  // 品类自定义选项卡（按型号/系列过滤内容；无匹配内容则不显示）
  const customTabs = productTabs
    .map((tab) => {
      const tr = tab.translations.find((x) => x.locale === locale) ?? tab.translations.find((x) => x.locale === "zh");
      return { code: tab.code, title: tr?.title ?? tab.code, content: filterTabContentBySeries(tr?.content ?? "", product.series, product.model) };
    })
    .filter((t) => t.content && t.content.trim().length > 0);

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
      <div className={`flex gap-8 ${isCiq ? "flex-row ciq-model-hero" : "flex-col md:flex-row"}`}>
        {/* 左：主图（580x580） */}
        <div className={isCiq ? "w-[380px] shrink-0 lg:w-[560px]" : "w-full md:w-[580px] md:shrink-0"}>
          <ProductGallery
            coverImage={product.coverImage}
            images={product.images}
            alt={product.model}
            noImageText={isEn ? "No image" : "无图"}
          />
          {/* 品牌专属：主图下方型号对应文案（国仪量子整宽展示在下方，其他品牌保持主图下方） */}
          {!isCiq &&
            (() => {
              const feat = (pt as any)?.features ?? null;
              if (!feat || !feat.trim()) return null;
              return (
                <div className="mt-6">
                  <div className="ciq-features" dangerouslySetInnerHTML={{ __html: feat }} />
                </div>
              );
            })()}
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
          compact={isCiq}
        />
      </div>

      {/* 国仪量子：整宽特性块（官网风格：主图下方型号对应文案） */}
      {isCiq &&
        (() => {
          const feat = (pt as any)?.features ?? null;
          if (!feat || !feat.trim()) return null;
          return (
            <div className="mt-8">
              <div className="ciq-features-wide" dangerouslySetInnerHTML={{ __html: feat }} />
            </div>
          );
        })()}

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
          specsHtml={/<table[\s>]/i.test(pt?.specsOverview ?? "") ? (pt?.specsOverview ?? "") : null}
          ciqShell={isCiq}
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
