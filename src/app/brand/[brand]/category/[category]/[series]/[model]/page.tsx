import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBrand, getBrandCategories, getBrandModel } from "@/lib/brand";
import { getBrandLocale, brandPath } from "@/lib/brand-locale";
import ProductGallery from "@/components/product-gallery";

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

  const I = {
    quote: isEn ? "Get a Quote" : "获取报价",
    inquiry: isEn ? "Send Inquiry" : "在线询价",
    specs: isEn ? "Specifications" : "技术参数",
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

      {/* 型号头 */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap gap-8">
          {/* 图片 */}
          <div className="w-full sm:w-[400px]">
            <ProductGallery
              coverImage={product.coverImage}
              images={product.images}
              alt={product.model}
              height="h-56"
              noImageText={isEn ? "No image" : "无图"}
            />
          </div>
          {/* 信息 */}
          <div className="flex-1">
            <div className="text-xs font-medium text-sky-600">{brandName} · {product.seriesName}</div>
            <h1 className="mt-1 font-mono text-2xl font-bold text-slate-900">{product.model}</h1>
            {pt?.summary && <p className="mt-3 text-sm leading-6 text-slate-600">{pt.summary}</p>}
            {/* 关键参数 chips */}
            {product.paramValues.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.paramValues.slice(0, 6).map((pv: any) => {
                  const name = pv.paramDefinition.translations.find((tr: any) => tr.locale === "zh")?.name ?? pv.paramDefinition.key;
                  const val = pv.valueString ?? (pv.valueBoolean ? "Yes" : "No");
                  return (
                    <span key={pv.id} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                      <span className="text-slate-400">{name}</span>{" "}
                      <span className="font-semibold">{val}</span>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Link
                href={`${base}/contact?model=${encodeURIComponent(product.model)}`}
                className="rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
              >
                {I.quote}
              </Link>
              <Link
                href={`${base}/contact?model=${encodeURIComponent(product.model)}`}
                className="rounded-md border border-sky-300 px-5 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
              >
                {I.inquiry}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 技术参数表 */}
      {specLines.length > 0 && (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">{I.specs}</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {specLines.map((row: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                  <td className="w-1/3 border-r border-slate-100 px-6 py-3 font-medium text-slate-600">
                    {row.name || "—"}
                  </td>
                  <td className="px-6 py-3 text-slate-800">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
