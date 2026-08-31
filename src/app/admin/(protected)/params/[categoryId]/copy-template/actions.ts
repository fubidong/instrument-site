"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type CopyTemplateState = {
  error?: string;
  success?: string;
  redirect?: string;
};

/**
 * 从其他类别复制参数模板（分组 + 参数定义）到当前类别
 */
export async function copyTemplateAction(
  _prev: CopyTemplateState,
  formData: FormData
): Promise<CopyTemplateState> {
  await requireAdmin();

  const targetCategoryId = (formData.get("targetCategoryId") as string) || "";
  const sourceCategoryId = (formData.get("sourceCategoryId") as string) || "";

  if (!targetCategoryId || !sourceCategoryId) {
    return { error: "请选择源类别和目标类别" };
  }
  if (targetCategoryId === sourceCategoryId) {
    return { error: "源类别和目标类别不能相同" };
  }

  // 检查目标类别是否已有参数
  const existing = await db.paramGroup.count({ where: { categoryId: targetCategoryId } });
  if (existing > 0) {
    return { error: "目标类别已有参数模板，复制会冲突。请先清空目标类别的参数。" };
  }

  try {
    // 读取源类别的分组和参数定义（含翻译）
    const sourceGroups = await db.paramGroup.findMany({
      where: { categoryId: sourceCategoryId },
      include: {
        translations: true,
        paramDefs: { include: { translations: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    if (sourceGroups.length === 0) {
      return { error: "源类别没有任何参数分组" };
    }

    // 按分组逐个复制（保留分组-参数映射）
    let groupCount = 0;
    let defCount = 0;
    for (const group of sourceGroups) {
      const newGroup = await db.paramGroup.create({
        data: {
          categoryId: targetCategoryId,
          code: group.code,
          sortOrder: group.sortOrder,
          translations: {
            create: group.translations.map((tr) => ({
              locale: tr.locale,
              name: tr.name,
            })),
          },
        },
      });
      groupCount++;

      for (const def of group.paramDefs) {
        await db.paramDefinition.create({
          data: {
            categoryId: targetCategoryId,
            paramGroupId: newGroup.id,
            key: def.key,
            type: def.type,
            unit: def.unit,
            isFilterable: def.isFilterable,
            isComparable: def.isComparable,
            isRequired: def.isRequired,
            isHighlight: def.isHighlight,
            sortOrder: def.sortOrder,
            options: def.options,
            minValue: def.minValue,
            maxValue: def.maxValue,
            step: def.step,
            precision: def.precision,
            translations: {
              create: def.translations.map((tr) => ({
                locale: tr.locale,
                name: tr.name,
                unit: tr.unit,
                description: tr.description,
              })),
            },
          },
        });
        defCount++;
      }
    }

    revalidatePath(`/admin/params/${targetCategoryId}/defs`);
    return {
      success: `复制成功：${groupCount} 个分组、${defCount} 个参数`,
      redirect: `/admin/params/${targetCategoryId}/defs`,
    };
  } catch (e: any) {
    return { error: e?.message || "复制失败" };
  }
}
