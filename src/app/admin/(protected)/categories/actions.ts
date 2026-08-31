"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type CategoryFormState = {
  error?: string;
  success?: string;
  redirect?: string;
};

/**
 * 新增/更新类别（含多语言）
 */
export async function saveCategoryAction(
  _prev: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const code = (formData.get("code") as string)?.trim() || "";
  const parentId = (formData.get("parentId") as string) || "";
  const icon = (formData.get("icon") as string) || "";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

  const nameZh = (formData.get("name_zh") as string)?.trim() || "";
  const descZh = (formData.get("desc_zh") as string)?.trim() || "";
  const nameEn = (formData.get("name_en") as string)?.trim() || "";
  const descEn = (formData.get("desc_en") as string)?.trim() || "";

  if (!code) return { error: "类别代码不能为空" };
  if (!nameZh) return { error: "中文名称不能为空" };
  if (!nameEn) return { error: "英文名称不能为空" };
  if (parentId && parentId === id) return { error: "父类别不能是自身" };

  try {
    if (id) {
      await db.$transaction([
        db.category.update({
          where: { id },
          data: { code, parentId: parentId || null, icon: icon || null, sortOrder },
        }),
        db.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: id, locale: "zh" } },
          create: { categoryId: id, locale: "zh", name: nameZh, description: descZh || null },
          update: { name: nameZh, description: descZh || null },
        }),
        db.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: id, locale: "en" } },
          create: { categoryId: id, locale: "en", name: nameEn, description: descEn || null },
          update: { name: nameEn, description: descEn || null },
        }),
      ]);
    } else {
      await db.category.create({
        data: {
          code,
          parentId: parentId || null,
          icon: icon || null,
          sortOrder,
          translations: {
            create: [
              { locale: "zh", name: nameZh, description: descZh || null },
              { locale: "en", name: nameEn, description: descEn || null },
            ],
          },
        },
      });
      revalidatePath("/admin/categories");
      return { success: "创建成功", redirect: "/admin/categories" };
    }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "类别代码已存在" };
    return { error: e?.message || "保存失败" };
  }

  revalidatePath("/admin/categories");
  return { success: "保存成功" };
}

/**
 * 删除类别（有子类/产品/参数关联则拒绝）
 */
export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const related = await db.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          children: true,
          products: true,
          productLines: true,
          paramGroups: true,
          paramDefs: true,
        },
      },
    },
  });

  if (!related) return;

  const count =
    related._count.children +
    related._count.products +
    related._count.productLines +
    related._count.paramGroups +
    related._count.paramDefs;

  if (count > 0) {
    throw new Error(
      `该类别下还有 ${count} 条关联数据（子类别/产品/系列/参数），无法删除。`
    );
  }

  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
