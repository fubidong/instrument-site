import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBrand, getBrandCategories, getBrandModel } from "@/lib/brand";
import { getBrandLocale, brandPath } from "@/lib/brand-locale";
import { db } from "@/lib/db";
import ProductGallery from "@/components/product-gallery";
import ProductDetailTabs, { type ParamGroup } from "@/components/product-detail-tabs";
import LeadDialog from "@/components/lead-dialog";

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
    const cur = await db.category.findUnique({ where: { id: curCatId }, select: { parentId: true } });
    if (!cur) break;
    curCatId = cur.parentId;
  }
  const productTabs = await db.productTab.findMany({
    where: { categoryId: { in: ancestors }, isActive: true },
    include: { translations: true },
    orderBy: { sortOrder: "asc" },
  });

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

  // 重点参数（3-4 个）：优先 isHighlight，否则取前 4 个参数值
  const pvList = (product.paramValues as any[]) ?? [];
  let highlights = pvList
    .filter((pv) => pv.isHighlight === true)
    .slice(0, 4)
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
      .slice(0, 4)
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
    return { code: tab.code, title: tr?.title ?? tab.code, content: tr?.content ?? "" };
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

      {/* 顶部两栏：左主图 + 右产品简介 */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* 左：主图（580x580） */}
        <div className="w-full lg:w-[580px] lg:shrink-0">
          <ProductGallery
            coverImage={product.coverImage}
            images={product.images}
            alt={product.model}
            noImageText={isEn ? "No image" : "无图"}
          />
        </div>

        {/* 右：产品简介 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-sky-600">{brandName}</span>
            <span>·</span>
            <span>{product.seriesName}</span>
          </div>
          <h1 className="mt-2 font-mono text-3xl font-bold text-slate-900">{product.model}</h1>
          {pt?.summary && <p className="mt-4 text-sm leading-6 text-slate-600">{pt.summary}</p>}

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
              locale={isEn ? "en" : "zh"}
              productId={product.id}
              productModel={product.model}
              productName={pt?.name ?? product.model}
            />
            {/* 申请样机（后台开关控制） */}
            <SampleDialogGate productId={product.id} productModel={product.model} productName={pt?.name ?? product.model} isEn={isEn} />
          </div>
        </div>
      </div>

      {/* 选项卡：产品介绍 / 技术参数 / 品类自定义 */}
      <div className="mt-10">
        <ProductDetailTabs
          intro={pt?.description ?? pt?.summary ?? null}
          highlights={highlights}
          paramGroups={paramGroups}
          customTabs={customTabs}
          labels={{ intro: I.intro, params: I.specs, noParams: I.noParams }}
        />
      </div>
    </div>
  );
}

/** 申请样机按钮（按产品 isSampleEnabled 开关控制显示） */
async function SampleDialogGate({
  productId,
  productModel,
  productName,
  isEn,
}: {
  productId: string;
  productModel: string;
  productName: string;
  isEn: boolean;
}) {
  const p = await db.product.findUnique({
    where: { id: productId },
    select: { isSampleEnabled: true },
  });
  if (!p?.isSampleEnabled) return null;
  return (
    <LeadDialog
      type="sample"
      locale={isEn ? "en" : "zh"}
      productId={productId}
      productModel={productModel}
      productName={productName}
    />
  );
}
