"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * 参数分组 CRUD（按类别管理）
 */

export type ParamGroupState = {
  error?: string;
  success?: string;
};

export async function saveParamGroupAction(
  _prev: ParamGroupState,
  formData: FormData
): Promise<ParamGroupState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const categoryId = (formData.get("categoryId") as string) || "";
  const code = (formData.get("code") as string)?.trim() || "";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
  const nameZh = (formData.get("name_zh") as string)?.trim() || "";
  const nameEn = (formData.get("name_en") as string)?.trim() || "";

  if (!categoryId) return { error: "缺少类别" };
  if (!code) return { error: "分组代码不能为空" };
  if (!nameZh || !nameEn) return { error: "中英文名称不能为空" };

  try {
    if (id) {
      await db.$transaction([
        db.paramGroup.update({
          where: { id },
          data: { code, sortOrder },
        }),
        db.paramGroupTranslation.upsert({
          where: { paramGroupId_locale: { paramGroupId: id, locale: "zh" } },
          create: { paramGroupId: id, locale: "zh", name: nameZh },
          update: { name: nameZh },
        }),
        db.paramGroupTranslation.upsert({
          where: { paramGroupId_locale: { paramGroupId: id, locale: "en" } },
          create: { paramGroupId: id, locale: "en", name: nameEn },
          update: { name: nameEn },
        }),
      ]);
    } else {
      await db.paramGroup.create({
        data: {
          categoryId,
          code,
          sortOrder,
          translations: {
            create: [
              { locale: "zh", name: nameZh },
              { locale: "en", name: nameEn },
            ],
          },
        },
      });
    }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "分组代码已存在" };
    return { error: e?.message || "保存失败" };
  }

  revalidatePath(`/admin/params/${categoryId}/groups`);
  return { success: "保存成功" };
}

export async function deleteParamGroupAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const group = await db.paramGroup.findUnique({
    where: { id },
    include: { _count: { select: { paramDefs: true } } },
  });
  if (!group) return;

  if (group._count.paramDefs > 0) {
    throw new Error(`该分组下还有 ${group._count.paramDefs} 个参数定义，请先删除参数。`);
  }

  await db.paramGroup.delete({ where: { id } });
  revalidatePath(`/admin/params/${group.categoryId}/groups`);
}
