import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveParamCategoryId } from "@/lib/params";
import ProductForm from "../../product-form";

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

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      translations: true,
      productLine: {
        include: {
          translations: true,
          brand: { include: { translations: true } },
          category: { include: { translations: true } },
        },
      },
      paramValues: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) notFound();

  const paramCatId = await resolveParamCategoryId(product.categoryId);
  const paramGroups = await getParamGroups(paramCatId);

  // 参数值按 defId 索引
  const paramValues: Record<string, any> = {};
  for (const pv of product.paramValues) {
    paramValues[pv.paramDefinitionId] = {
      valueNumber: pv.valueNumber,
      valueMin: pv.valueMin,
      valueMax: pv.valueMax,
      valueString: pv.valueString,
      valueBoolean: pv.valueBoolean,
      isHighlight: pv.isHighlight,
    };
  }

  const line = product.productLine;
  const lt = Object.fromEntries(line.translations.map((tr) => [tr.locale, tr]));
  const bt = Object.fromEntries(line.brand.translations.map((tr) => [tr.locale, tr]));
  const ct = Object.fromEntries(line.category.translations.map((tr) => [tr.locale, tr]));

  const lineOptions = [
    {
      id: line.id,
      code: line.code,
      zhName: lt["zh"]?.name ?? line.code,
      enName: lt["en"]?.name ?? "",
      brandZh: bt["zh"]?.name ?? line.brand.code,
      categoryZh: ct["zh"]?.name ?? line.category.code,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">编辑产品 · {product.model}</h1>
        <Link href="/admin/products" className="text-sm text-sky-600 hover:underline">
          ← 返回产品列表
        </Link>
      </div>
      <ProductForm
        product={{
          id: product.id,
          productLineId: product.productLineId,
          model: product.model,
          sku: product.sku,
          coverImage: product.coverImage,
          sortOrder: product.sortOrder,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          isSampleEnabled: product.isSampleEnabled,
          translations: product.translations,
        }}
        lines={lineOptions}
        paramGroups={paramGroups}
        paramValues={paramValues}
        gallery={product.images.map((img) => ({
          id: img.id,
          imagePath: img.imagePath,
          sortOrder: img.sortOrder,
        }))}
      />
    </div>
  );
}
