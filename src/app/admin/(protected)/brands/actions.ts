"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type BrandFormState = {
  error?: string;
  success?: string;
  redirect?: string;
};

/**
 * 新增/更新品牌（含多语言）
 */
export async function saveBrandAction(
  _prev: BrandFormState,
  formData: FormData
): Promise<BrandFormState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const code = (formData.get("code") as string)?.trim() || "";
  const logo = (formData.get("logo") as string) || "";
  const website = (formData.get("website") as string)?.trim() || "";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
  const isActive = formData.get("isActive") === "on";

  const nameZh = (formData.get("name_zh") as string)?.trim() || "";
  const descZh = (formData.get("desc_zh") as string)?.trim() || "";
  const fullDescZh = (formData.get("fullDesc_zh") as string)?.trim() || "";
  const nameEn = (formData.get("name_en") as string)?.trim() || "";
  const descEn = (formData.get("desc_en") as string)?.trim() || "";
  const fullDescEn = (formData.get("fullDesc_en") as string)?.trim() || "";

  if (!code) return { error: "品牌代码不能为空" };
  if (!nameZh) return { error: "中文名称不能为空" };
  if (!nameEn) return { error: "英文名称不能为空" };

  try {
    if (id) {
      // 更新
      await db.$transaction([
        db.brand.update({
          where: { id },
          data: { code, logo: logo || null, website: website || null, sortOrder, isActive },
        }),
        db.brandTranslation.upsert({
          where: { brandId_locale: { brandId: id, locale: "zh" } },
          create: { brandId: id, locale: "zh", name: nameZh, description: descZh || null, fullDescription: fullDescZh || null },
          update: { name: nameZh, description: descZh || null, fullDescription: fullDescZh || null },
        }),
        db.brandTranslation.upsert({
          where: { brandId_locale: { brandId: id, locale: "en" } },
          create: { brandId: id, locale: "en", name: nameEn, description: descEn || null, fullDescription: fullDescEn || null },
          update: { name: nameEn, description: descEn || null, fullDescription: fullDescEn || null },
        }),
      ]);
    } else {
      // 新增
      await db.brand.create({
        data: {
          code,
          logo: logo || null,
          website: website || null,
          sortOrder,
          isActive,
          translations: {
            create: [
              { locale: "zh", name: nameZh, description: descZh || null, fullDescription: fullDescZh || null },
              { locale: "en", name: nameEn, description: descEn || null, fullDescription: fullDescEn || null },
            ],
          },
        },
      });
      revalidatePath("/admin/brands");
      return { success: "创建成功", redirect: "/admin/brands" };
    }
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { error: "品牌代码已存在，请更换" };
    }
    return { error: e?.message || "保存失败" };
  }

  revalidatePath("/admin/brands");
  return { success: "保存成功" };
}

/**
 * 删除品牌（有关联则拒绝）
 */
export async function deleteBrandAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const related = await db.brand.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true, productLines: true, categories: true, documents: true } },
    },
  });

  if (!related) {
    redirect("/admin/brands");
  }

  const count =
    related._count.products +
    related._count.productLines +
    related._count.categories +
    related._count.documents;

  if (count > 0) {
    throw new Error(
      `该品牌下还有 ${count} 条关联数据（产品/系列/类别/资料），无法删除。请先删除关联数据。`
    );
  }

  await db.brand.delete({ where: { id } });
  revalidatePath("/admin/brands");
  redirect("/admin/brands");
}

/**
 * 切换启用/停用
 */
export async function toggleBrandAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "1";
  await db.brand.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/brands");
}
