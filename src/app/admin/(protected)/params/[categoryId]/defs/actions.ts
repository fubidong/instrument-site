"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type ParamDefState = {
  error?: string;
  success?: string;
};

/**
 * 新增/更新参数定义（动态参数系统核心）
 */
export async function saveParamDefAction(
  _prev: ParamDefState,
  formData: FormData
): Promise<ParamDefState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const categoryId = (formData.get("categoryId") as string) || "";
  const paramGroupId = (formData.get("paramGroupId") as string) || "";
  const key = (formData.get("key") as string)?.trim() || "";
  const type = (formData.get("type") as string) || "string";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
  const isFilterable = formData.get("isFilterable") === "on";
  const isComparable = formData.get("isComparable") === "on";
  const isRequired = formData.get("isRequired") === "on";
  const isHighlight = formData.get("isHighlight") === "on";
  const filterUI = (formData.get("filterUI") as string)?.trim() || null;
  const precision = formData.get("precision") ? parseInt(formData.get("precision") as string) : null;
  const minValue = formData.get("minValue") ? parseFloat(formData.get("minValue") as string) : null;
  const maxValue = formData.get("maxValue") ? parseFloat(formData.get("maxValue") as string) : null;
  const step = formData.get("step") ? parseFloat(formData.get("step") as string) : null;
  const optionsRaw = (formData.get("options") as string) || "";

  const nameZh = (formData.get("name_zh") as string)?.trim() || "";
  const nameEn = (formData.get("name_en") as string)?.trim() || "";
  const unitZh = (formData.get("unit_zh") as string)?.trim() || "";
  const unitEn = (formData.get("unit_en") as string)?.trim() || "";
  const descZh = (formData.get("desc_zh") as string)?.trim() || "";
  const descEn = (formData.get("desc_en") as string)?.trim() || "";

  // 主表 unit 字段存英文单位（作为默认单位，前台主要展示英文单位）
  const unit = unitEn || unitZh || "";

  if (!categoryId) return { error: "缺少类别" };
  if (!paramGroupId) return { error: "请选择参数分组" };
  if (!key) return { error: "参数代码不能为空" };
  if (!nameZh || !nameEn) return { error: "中英文名称不能为空" };

  // 校验类型与数值范围
  if (type === "enum") {
    try {
      const parsed = JSON.parse(optionsRaw || "[]");
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { error: "枚举类型必须填写至少一个选项" };
      }
    } catch {
      return { error: "枚举选项格式错误，需为 JSON 数组" };
    }
  }
  if (type === "number" || type === "range") {
    if (minValue != null && maxValue != null && minValue > maxValue) {
      return { error: "最小值不能大于最大值" };
    }
  }

  try {
    if (id) {
      await db.$transaction([
        db.paramDefinition.update({
          where: { id },
          data: {
            paramGroupId,
            key,
            type: type as any,
            unit: unit || null,
            isFilterable,
            isComparable,
            isRequired,
            isHighlight,
            filterUI,
            sortOrder,
            options: optionsRaw || null,
            minValue,
            maxValue,
            step,
            precision,
          },
        }),
        db.paramDefinitionTranslation.upsert({
          where: { paramDefinitionId_locale: { paramDefinitionId: id, locale: "zh" } },
          create: { paramDefinitionId: id, locale: "zh", name: nameZh, unit: unitZh || null, description: descZh || null },
          update: { name: nameZh, unit: unitZh || null, description: descZh || null },
        }),
        db.paramDefinitionTranslation.upsert({
          where: { paramDefinitionId_locale: { paramDefinitionId: id, locale: "en" } },
          create: { paramDefinitionId: id, locale: "en", name: nameEn, unit: unitEn || null, description: descEn || null },
          update: { name: nameEn, unit: unitEn || null, description: descEn || null },
        }),
      ]);
    } else {
      await db.paramDefinition.create({
        data: {
          categoryId,
          paramGroupId,
          key,
          type: type as any,
          unit: unit || null,
          isFilterable,
          isComparable,
          isRequired,
          isHighlight,
          filterUI,
          sortOrder,
          options: optionsRaw || null,
          minValue,
          maxValue,
          step,
          precision,
          translations: {
            create: [
              { locale: "zh", name: nameZh, unit: unitZh || null, description: descZh || null },
              { locale: "en", name: nameEn, unit: unitEn || null, description: descEn || null },
            ],
          },
        },
      });
    }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "参数代码已存在（同一类别下唯一）" };
    return { error: e?.message || "保存失败" };
  }

  revalidatePath(`/admin/params/${categoryId}/defs`);
  return { success: "保存成功" };
}

/**
 * 删除参数定义（有产品参数值则拒绝）
 */
export async function deleteParamDefAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const def = await db.paramDefinition.findUnique({
    where: { id },
    include: { _count: { select: { values: true } } },
  });
  if (!def) return;

  if (def._count.values > 0) {
    throw new Error(`该参数已有 ${def._count.values} 个产品的参数值，不能删除。可编辑调整。`);
  }

  await db.paramDefinition.delete({ where: { id } });
  revalidatePath(`/admin/params/${def.categoryId}/defs`);
}
