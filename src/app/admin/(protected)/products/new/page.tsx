import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveParamCategoryId } from "@/lib/params";
import ProductForm from "../product-form";

async function getParamGroups(categoryId: string) {
  const groups = await db.paramGroup.findMany({
    where: { categoryId },
    include: {
      translations: true,
      paramDefs: {
        include: { translations: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
  return groups.map((g) => ({
    id: g.id,
    code: g.code,
    sortOrder: g.sortOrder,
    translations: g.translations.map((tr) => ({ locale: tr.locale, name: tr.name })),
    paramDefs: g.paramDefs.map((d) => ({
      id: d.id,
      key: d.key,
      type: d.type,
      unit: d.unit,
      isRequired: d.isRequired,
      isHighlight: d.isHighlight,
      options: d.options,
      translations: d.translations.map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        unit: tr.unit,
      })),
    })),
  }));
}

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ lineId?: string }>;
}) {
  const { lineId } = await searchParams;

  const lines = await db.productLine.findMany({
    where: { isActive: true },
    include: {
      translations: true,
      brand: { include: { translations: true } },
      category: { include: { translations: true } },
    },
    orderBy: [{ brand: { code: "asc" } }, { sortOrder: "asc" }],
  });

  const lineOptions = lines.map((l) => {
    const lt = Object.fromEntries(l.translations.map((tr) => [tr.locale, tr]));
    const bt = Object.fromEntries(l.brand.translations.map((tr) => [tr.locale, tr]));
    const ct = Object.fromEntries(l.category.translations.map((tr) => [tr.locale, tr]));
    return {
      id: l.id,
      code: l.code,
      zhName: lt["zh"]?.name ?? l.code,
      enName: lt["en"]?.name ?? "",
      brandZh: bt["zh"]?.name ?? l.brand.code,
      categoryZh: ct["zh"]?.name ?? l.category.code,
    };
  });

  // 第一步：选择系列
  if (!lineId) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">新增产品</h1>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">1. 选择产品系列</h2>
          {lines.length === 0 ? (
            <p className="text-sm text-amber-600">
              暂无产品系列，请先到「产品系列」创建。
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lineOptions.map((l) => (
                <Link
                  key={l.id}
                  href={`/admin/products/new?lineId=${l.id}`}
                  className="rounded-lg border border-slate-200 p-4 hover:border-sky-400 hover:bg-sky-50/50"
                >
                  <div className="text-sm font-semibold text-slate-800">{l.zhName}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {l.brandZh} / {l.categoryZh} / {l.code}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 第二步：加载系列 + 参数模板
  const line = await db.productLine.findUnique({
    where: { id: lineId },
    include: { category: { include: { translations: true } } },
  });
  if (!line) notFound();

  const paramCatId = await resolveParamCategoryId(line.categoryId);
  const paramGroups = await getParamGroups(paramCatId);
  const ct = Object.fromEntries(line.category.translations.map((tr) => [tr.locale, tr]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">新增产品</h1>
        <Link href="/admin/products/new" className="text-sm text-sky-600 hover:underline">
          ← 重新选择系列
        </Link>
      </div>
      <div className="rounded-md bg-sky-50 px-4 py-2 text-sm text-sky-700">
        系列已选，类别「{ct["zh"]?.name ?? line.category.code}」参数模板已加载（
        {paramGroups.length} 个分组）
      </div>
      <ProductForm
        product={null}
        lines={lineOptions}
        paramGroups={paramGroups}
        paramValues={{}}
        initialProductLineId={lineId}
      />
    </div>
  );
}
