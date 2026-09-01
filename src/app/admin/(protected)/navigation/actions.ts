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
