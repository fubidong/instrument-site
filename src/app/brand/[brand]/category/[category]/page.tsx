import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBrand, getBrandCategories } from "@/lib/brand";
import { getBrandCategoryDetail } from "@/lib/brand-category";
import { getBrandLocale, brandPath } from "@/lib/brand-locale";

export default async function BrandCategoryPage({
  params,
}: {
  params: Promise<{ brand: string; category: string }>;
}) {
  const { brand: brandCode, category: catCode } = await params;
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

  const subCats = categories.filter((c) => c.parentId === cat.id);
  const catIds = [cat.id, ...subCats.map((s) => s.id)];
  const detail = await getBrandCategoryDetail(brand.id, catIds, locale);

  const I = {
    models: isEn ? "Models" : "型号",
    allModels: isEn ? "All Models →" : "全部型号 →",
    noData: isEn ? "No products yet" : "暂无产品",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* 面包屑 */}
      <div className="mb-6 text-sm text-slate-500">
        <Link href={base} className="hover:text-sky-600">{brandName}</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{cat.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">{cat.name}</h1>
      <p className="mt-1 text-sm text-slate-500">{cat.enName}</p>

      {/* 子分类快捷跳转 */}
      {subCats.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {subCats.map((s) => (
            <Link
              key={s.id}
              href={`${base}/category/${s.code.toLowerCase()}`}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-sky-300 hover:text-sky-700"
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {/* 系列呈现：每个系列一个对比表 */}
      <div className="mt-8 space-y-10">
        {detail.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 py-16 text-center text-slate-400">
            {I.noData}
          </div>
        )}
        {detail.map((series) => (
          <div key={series.id} className="rounded-lg border border-slate-200 bg-white">
            {/* 系列头 */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{series.name}</h2>
                <span className="text-xs text-slate-400">
                  {series.code} · {series.models.length} {I.models}
                </span>
              </div>
              {series.models.length > 0 && (
                <Link
                  href={`${base}/category/${cat.code.toLowerCase()}/${encodeURIComponent(series.code)}`}
                  className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
                >
                  {I.allModels}
                </Link>
              )}
            </div>

            {/* 型号对比表（横向） */}
            {series.models.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {/* 型号行（图片+型号） */}
                    <tr>
                      <td className="min-w-40 whitespace-nowrap border-r border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 align-top">
                        {isEn ? "Model" : "型号"}
                      </td>
                      {series.models.map((m) => (
                        <td key={m.id} className="min-w-[130px] border-r border-slate-50 px-3 py-2 text-center align-top">
                          <Link
                            href={`${base}/category/${cat.code.toLowerCase()}/${encodeURIComponent(series.code)}/${encodeURIComponent(m.model)}`}
                            className="block"
                          >
                            {m.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.coverImage} alt={m.model} className="mx-auto h-20 w-28 object-contain" />
                            ) : (
                              <div className="mx-auto flex h-20 w-28 items-center justify-center bg-slate-100 text-slate-300">
                                {isEn ? "N/A" : "无图"}
                              </div>
                            )}
                            <div className="mt-2 font-mono text-xs font-bold text-slate-800">{m.model}</div>
                          </Link>
                        </td>
                      ))}
                    </tr>
                    {/* 关键参数行 */}
                    {series.compareKeys.map((key) => (
                      <tr key={key.id}>
                        <td className="min-w-40 whitespace-nowrap border-r border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                          {key.name}
                          {key.unit && <span className="ml-0.5 text-slate-400">{key.unit}</span>}
                        </td>
                        {series.models.map((m) => {
                          const val = m.params[key.id];
                          return (
                            <td key={m.id} className="border-r border-slate-50 px-3 py-2 text-center text-xs text-slate-700">
                              {val ?? <span className="text-slate-300">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
