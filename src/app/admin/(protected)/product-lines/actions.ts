"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type ProductLineFormState = {
  error?: string;
  success?: string;
  redirect?: string;
};

/**
 * 新增/更新产品系列
 */
export async function saveProductLineAction(
  _prev: ProductLineFormState,
  formData: FormData
): Promise<ProductLineFormState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const brandId = (formData.get("brandId") as string) || "";
  const categoryId = (formData.get("categoryId") as string) || "";
  const code = (formData.get("code") as string)?.trim() || "";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
  const isActive = formData.get("isActive") === "on";

  const nameZh = (formData.get("name_zh") as string)?.trim() || "";
  const descZh = (formData.get("desc_zh") as string)?.trim() || "";
  const nameEn = (formData.get("name_en") as string)?.trim() || "";
  const descEn = (formData.get("desc_en") as string)?.trim() || "";

  if (!brandId) return { error: "请选择品牌" };
  if (!categoryId) return { error: "请选择类别" };
  if (!code) return { error: "系列代码不能为空" };
  if (!nameZh || !nameEn) return { error: "中英文名称不能为空" };

  try {
    if (id) {
      await db.$transaction([
        db.productLine.update({
          where: { id },
          data: { brandId, categoryId, code, sortOrder, isActive },
        }),
        db.productLineTranslation.upsert({
          where: { productLineId_locale: { productLineId: id, locale: "zh" } },
          create: { productLineId: id, locale: "zh", name: nameZh, description: descZh || null },
          update: { name: nameZh, description: descZh || null },
        }),
        db.productLineTranslation.upsert({
          where: { productLineId_locale: { productLineId: id, locale: "en" } },
          create: { productLineId: id, locale: "en", name: nameEn, description: descEn || null },
          update: { name: nameEn, description: descEn || null },
        }),
      ]);
    } else {
      await db.productLine.create({
        data: {
          brandId,
          categoryId,
          code,
          sortOrder,
          isActive,
          translations: {
            create: [
              { locale: "zh", name: nameZh, description: descZh || null },
              { locale: "en", name: nameEn, description: descEn || null },
            ],
          },
        },
      });
      revalidatePath("/admin/products");
      return { success: "创建成功", redirect: "/admin/products" };
    }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "该品牌+类别下系列代码已存在" };
    return { error: e?.message || "保存失败" };
  }

  revalidatePath("/admin/products");
  return { success: "保存成功" };
}

/**
 * 删除产品系列（有产品则拒绝）
 */
export async function deleteProductLineAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const line = await db.productLine.findUnique({
    where: { id },
    include: { _count: { select: { products: true, documents: true } } },
  });
  if (!line) return;

  const count = line._count.products + line._count.documents;
  if (count > 0) {
    throw new Error(`该系列下有 ${count} 个产品/资料，无法删除。`);
  }

  await db.productLine.delete({ where: { id } });
  revalidatePath("/admin/products");
}
