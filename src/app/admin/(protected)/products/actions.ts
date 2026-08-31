"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type ProductFormState = {
  error?: string;
  success?: string;
  redirect?: string;
};

type ParamValueInput = {
  paramDefinitionId: string;
  valueNumber?: number | null;
  valueMin?: number | null;
  valueMax?: number | null;
  valueString?: string | null;
  valueBoolean?: boolean | null;
  isHighlight?: boolean | null;
};

/**
 * 解析单条参数值（按参数类型）
 */
function parseParamValue(def: any, formData: FormData): ParamValueInput | null {
  const prefix = `param_${def.id}_`;
  const has = (name: string) => formData.get(prefix + name) !== null;
  const get = (name: string) => formData.get(prefix + name);

  const base: ParamValueInput = { paramDefinitionId: def.id };

  switch (def.type) {
    case "number":
    case "range": {
      if (def.type === "range") {
        const vMin = get("min");
        const vMax = get("max");
        if (!has("min") && !has("max")) return null;
        return {
          ...base,
          valueMin: vMin !== "" && vMin !== null ? parseFloat(vMin as string) : null,
          valueMax: vMax !== "" && vMax !== null ? parseFloat(vMax as string) : null,
          isHighlight: get("hl") === "on",
        };
      }
      const v = get("value");
      if (!has("value") || v === "") return null;
      return {
        ...base,
        valueNumber: parseFloat(v as string),
        isHighlight: get("hl") === "on",
      };
    }
    case "enum": {
      const v = get("value");
      if (!has("value") || v === "") return null;
      return { ...base, valueString: v as string };
    }
    case "boolean": {
      if (!has("value")) return null;
      return { ...base, valueBoolean: get("value") === "on" || get("value") === "true" };
    }
    case "string": {
      const v = get("value");
      if (!has("value") || v === "") return null;
      return { ...base, valueString: v as string };
    }
    default:
      return null;
  }
}

/**
 * 新增/更新产品（含参数值批量保存）
 */
export async function saveProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const productLineId = (formData.get("productLineId") as string) || "";
  const model = (formData.get("model") as string)?.trim() || "";
  const sku = (formData.get("sku") as string)?.trim() || "";
  const coverImage = (formData.get("coverImage") as string)?.trim() || "";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
  const isActive = formData.get("isActive") === "on";
  const isFeatured = formData.get("isFeatured") === "on";

  const nameZh = (formData.get("name_zh") as string)?.trim() || "";
  const summaryZh = (formData.get("summary_zh") as string)?.trim() || "";
  const nameEn = (formData.get("name_en") as string)?.trim() || "";
  const summaryEn = (formData.get("summary_en") as string)?.trim() || "";

  if (!productLineId) return { error: "请选择产品系列" };
  if (!model) return { error: "型号不能为空" };
  if (!nameZh || !nameEn) return { error: "中英文名称不能为空" };

  const line = await db.productLine.findUnique({
    where: { id: productLineId },
    include: { category: true, brand: true },
  });
  if (!line) return { error: "产品系列不存在" };
  const brandId = line.brandId;
  const categoryId = line.categoryId;

  try {
    // 收集参数值
    const defs = await db.paramDefinition.findMany({
      where: { categoryId: line.categoryId },
    });
    const paramValues: ParamValueInput[] = [];
    for (const def of defs) {
      const pv = parseParamValue(def, formData);
      if (pv) paramValues.push(pv);
    }

    if (id) {
      await db.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: {
            productLineId,
            brandId,
            categoryId,
            model,
            sku: sku || null,
            coverImage: coverImage || null,
            sortOrder,
            isActive,
            isFeatured,
          },
        });
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: id, locale: "zh" } },
          create: { productId: id, locale: "zh", name: nameZh, summary: summaryZh || null },
          update: { name: nameZh, summary: summaryZh || null },
        });
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: id, locale: "en" } },
          create: { productId: id, locale: "en", name: nameEn, summary: summaryEn || null },
          update: { name: nameEn, summary: summaryEn || null },
        });
        // 删除旧参数值，重建（简单可靠）
        await tx.productParamValue.deleteMany({ where: { productId: id } });
        for (const pv of paramValues) {
          await tx.productParamValue.create({
            data: { ...pv, productId: id },
          });
        }
      });
    } else {
      await db.product.create({
        data: {
          productLineId,
          brandId,
          categoryId,
          model,
          sku: sku || null,
          coverImage: coverImage || null,
          sortOrder,
          isActive,
          isFeatured,
          translations: {
            create: [
              { locale: "zh", name: nameZh, summary: summaryZh || null },
              { locale: "en", name: nameEn, summary: summaryEn || null },
            ],
          },
          paramValues: {
            create: paramValues,
          },
        },
      });
    }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "该型号已存在" };
    return { error: e?.message || "保存失败" };
  }

  revalidatePath("/admin/products");
  return { success: "保存成功", redirect: "/admin/products" };
}

/**
 * 删除产品（有关联询价/资料则拒绝）
 */
export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const product = await db.product.findUnique({
    where: { id },
    include: { _count: { select: { inquiries: true, documents: true } } },
  });
  if (!product) return;

  const count = product._count.inquiries + product._count.documents;
  if (count > 0) {
    throw new Error(`该产品有 ${count} 条询价/资料关联，无法删除。`);
  }

  await db.product.delete({ where: { id } });
  revalidatePath("/admin/products");
}
