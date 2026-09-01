"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * 切换单个品类是否在导航显示
 * 复用：品类管理页开关也走这里
 */
export async function toggleCategoryNavAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const showInNav = formData.get("showInNav") === "true";
  await db.category.update({ where: { id }, data: { showInNav } });
  revalidatePath("/admin/navigation");
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

/**
 * 批量设置一组品类的导航显示状态
 * brandId 为空字符串表示"综合站"（全站品类）；"__all__" 表示全部；否则为具体品牌
 */
export async function batchSetCategoryNavAction(formData: FormData) {
  await requireAdmin();
  const show = formData.get("show") === "true";
  const brandScope = (formData.get("brandId") as string) || "global";

  let where: any = {};
  if (brandScope === "global") {
    where = { brandId: null };
  } else if (brandScope !== "__all__") {
    where = { brandId: brandScope };
  }

  await db.category.updateMany({ where, data: { showInNav: show } });
  revalidatePath("/admin/navigation");
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

/**
 * 在导航设置页新增导航栏目（一级或二级菜单）
 * brandId 为空字符串 → 综合站（全站品类）；非空 → 对应品牌站
 * parentId 为空 → 一级菜单；非空 → 二级菜单
 */
export async function createNavCategoryAction(formData: FormData) {
  await requireAdmin();
  const brandIdRaw = (formData.get("brandId") as string) || "";
  const parentId = (formData.get("parentId") as string) || "";
  const code = (formData.get("code") as string)?.trim().toUpperCase() || "";
  const nameZh = (formData.get("name_zh") as string)?.trim() || "";
  const nameEn = (formData.get("name_en") as string)?.trim() || "";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

  if (!code || !nameZh || !nameEn) {
    throw new Error("名称（中/英）与代码均为必填");
  }

  const brandId = brandIdRaw || null;
  // 二级菜单必须与父级在同一分组下，防止跨品牌层级
  if (parentId) {
    const parent = await db.category.findUnique({ where: { id: parentId } });
    if (!parent || parent.brandId !== brandId) {
      throw new Error("上级菜单必须与当前分组一致");
    }
  }

  await db.category.create({
    data: {
      code,
      parentId: parentId || null,
      brandId,
      sortOrder,
      showInNav: true,
      translations: {
        create: [
          { locale: "zh", name: nameZh },
          { locale: "en", name: nameEn },
        ],
      },
    },
  });
  revalidatePath("/admin/navigation");
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}
