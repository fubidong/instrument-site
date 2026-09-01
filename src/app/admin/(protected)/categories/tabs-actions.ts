"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type TabFormState = {
  error?: string;
  success?: string;
};

/**
 * 新增/更新品类详情页自定义选项卡
 */
export async function saveProductTabAction(
  _prev: TabFormState,
  formData: FormData
): Promise<TabFormState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const categoryId = (formData.get("categoryId") as string) || "";
  const code = (formData.get("code") as string)?.trim() || "";
  const icon = (formData.get("icon") as string)?.trim() || "";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
  const isActive = formData.get("isActive") === "on";
  const titleZh = (formData.get("title_zh") as string)?.trim() || "";
  const contentZh = (formData.get("content_zh") as string)?.trim() || "";
  const titleEn = (formData.get("title_en") as string)?.trim() || "";
  const contentEn = (formData.get("content_en") as string)?.trim() || "";

  if (!categoryId) return { error: "缺少品类" };
  if (!code) return { error: "请填写选项卡标识（code）" };
  if (!titleZh || !titleEn) return { error: "中英文标题不能为空" };

  try {
    if (id) {
      await db.$transaction(async (tx) => {
        await tx.productTab.update({
          where: { id },
          data: { code, icon: icon || null, sortOrder, isActive },
        });
        await tx.productTabTranslation.upsert({
          where: { productTabId_locale: { productTabId: id, locale: "zh" } },
          create: { productTabId: id, locale: "zh", title: titleZh, content: contentZh || null },
          update: { title: titleZh, content: contentZh || null },
        });
        await tx.productTabTranslation.upsert({
          where: { productTabId_locale: { productTabId: id, locale: "en" } },
          create: { productTabId: id, locale: "en", title: titleEn, content: contentEn || null },
          update: { title: titleEn, content: contentEn || null },
        });
      });
    } else {
      const dup = await db.productTab.findUnique({
        where: { categoryId_code: { categoryId, code } },
      });
      if (dup) return { error: "该品类下已存在相同 code 的选项卡" };
      await db.productTab.create({
        data: {
          categoryId,
          code,
          icon: icon || null,
          sortOrder,
          isActive,
          translations: {
            create: [
              { locale: "zh", title: titleZh, content: contentZh || null },
              { locale: "en", title: titleEn, content: contentEn || null },
            ],
          },
        },
      });
    }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "该品类下已存在相同 code 的选项卡" };
    return { error: e?.message || "保存失败" };
  }

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${categoryId}/edit`);
  return { success: "保存成功" };
}

/**
 * 删除品类详情页自定义选项卡
 */
export async function deleteProductTabAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const tab = await db.productTab.findUnique({ where: { id } });
  if (!tab) return;
  await db.productTab.delete({ where: { id } }); // translations 级联删除
  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${tab.categoryId}/edit`);
}
