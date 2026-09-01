"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { collectSubtreeIds } from "@/lib/nav";

export type NavActionResult = {
  success: boolean;
  data?: any;
  error?: string;
};

/** 导航菜单输入校验 Schema */
const navInputSchema = z.object({
  parentId: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  path: z
    .string()
    .min(1, "路由地址不能为空")
    .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "路由需以 / 开头，外链请填完整 http(s) 地址"),
  permission: z.string().nullable().optional(),
  sort: z.coerce.number().int().min(0).optional().default(0),
  isVisible: z.boolean().optional().default(true),
  isExternal: z.boolean().optional().default(false),
  target: z.enum(["_self", "_blank"]).optional().default("_self"),
  platform: z.enum(["web", "admin", "app"]).optional().default("web"),
  brandId: z.string().nullable().optional(),
  nameZh: z.string().trim().min(2, "中文名称至少 2 个字符"),
  nameEn: z.string().trim().min(2, "英文名称至少 2 个字符"),
});

function parseNavForm(formData: FormData) {
  const brandId = (formData.get("brandId") as string) || null;
  const parentId = (formData.get("parentId") as string) || null;
  return navInputSchema.safeParse({
    parentId,
    icon: (formData.get("icon") as string) || null,
    path: formData.get("path") as string,
    permission: (formData.get("permission") as string) || null,
    sort: formData.get("sort") as string,
    isVisible: formData.get("isVisible") === "true",
    isExternal: formData.get("isExternal") === "true",
    target: (formData.get("target") as string) || "_self",
    platform: (formData.get("platform") as string) || "web",
    brandId,
    nameZh: formData.get("nameZh") as string,
    nameEn: formData.get("nameEn") as string,
  });
}

async function revalidateNav(brandId: string | null) {
  revalidatePath("/admin/navigation");
  revalidatePath("/", "layout");
  if (brandId) {
    const brand = await db.brand.findUnique({ where: { id: brandId }, select: { code: true } });
    if (brand) {
      revalidatePath(`/${brand.code.toLowerCase()}`);
      revalidatePath(`/${brand.code.toLowerCase()}/en`);
    }
  }
}

/** 创建导航菜单 */
export async function createNavAction(formData: FormData): Promise<NavActionResult> {
  try {
    await requireAdmin();
    const parsed = parseNavForm(formData);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };
    const d = parsed.data;

    // 父级存在性校验（存在且未软删除）
    if (d.parentId) {
      const parent = await db.navMenu.findUnique({ where: { id: d.parentId } });
      if (!parent || parent.deletedAt) return { success: false, error: "上级菜单不存在或已删除" };
    }

    const menu = await db.navMenu.create({
      data: {
        parentId: d.parentId,
        icon: d.icon,
        path: d.path,
        permission: d.permission,
        sort: d.sort ?? 0,
        isVisible: d.isVisible ?? true,
        isExternal: d.isExternal ?? false,
        target: d.target ?? "_self",
        platform: d.platform ?? "web",
        brandId: d.brandId,
        translations: {
          create: [
            { locale: "zh", name: d.nameZh },
            { locale: "en", name: d.nameEn },
          ],
        },
      },
    });
    await revalidateNav(d.brandId ?? null);
    return { success: true, data: { id: menu.id } };
  } catch (e: any) {
    return { success: false, error: e?.message || "创建失败" };
  }
}

/** 更新导航菜单 */
export async function updateNavAction(formData: FormData): Promise<NavActionResult> {
  try {
    await requireAdmin();
    const id = (formData.get("id") as string) || "";
    if (!id) return { success: false, error: "缺少菜单 id" };
    const parsed = parseNavForm(formData);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };
    const d = parsed.data;

    const exist = await db.navMenu.findUnique({ where: { id } });
    if (!exist || exist.deletedAt) return { success: false, error: "菜单不存在" };
    // 父级不能是自己或自己的子孙（防环）
    if (d.parentId) {
      if (d.parentId === id) return { success: false, error: "上级菜单不能是自身" };
      const all = await db.navMenu.findMany({ where: { deletedAt: null }, select: { id: true, parentId: true } });
      if (collectSubtreeIds(id, all).includes(d.parentId))
        return { success: false, error: "不能将菜单挂到自己的子孙节点下" };
      const parent = await db.navMenu.findUnique({ where: { id: d.parentId } });
      if (!parent || parent.deletedAt) return { success: false, error: "上级菜单不存在或已删除" };
    }

    await db.navMenu.update({
      where: { id },
      data: {
        parentId: d.parentId,
        icon: d.icon,
        path: d.path,
        permission: d.permission,
        sort: d.sort ?? 0,
        isVisible: d.isVisible ?? true,
        isExternal: d.isExternal ?? false,
        target: d.target ?? "_self",
        platform: d.platform ?? "web",
        brandId: d.brandId,
        translations: {
          upsert: [
            {
              where: { navMenuId_locale: { navMenuId: id, locale: "zh" } },
              create: { locale: "zh", name: d.nameZh },
              update: { name: d.nameZh },
            },
            {
              where: { navMenuId_locale: { navMenuId: id, locale: "en" } },
              create: { locale: "en", name: d.nameEn },
              update: { name: d.nameEn },
            },
          ],
        },
      },
    });
    await revalidateNav(d.brandId ?? null);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "更新失败" };
  }
}

/** 删除导航菜单（递归软删除所有子孙） */
export async function deleteNavAction(formData: FormData): Promise<NavActionResult> {
  try {
    await requireAdmin();
    const id = (formData.get("id") as string) || "";
    if (!id) return { success: false, error: "缺少菜单 id" };
    const menu = await db.navMenu.findUnique({ where: { id } });
    if (!menu || menu.deletedAt) return { success: false, error: "菜单不存在" };

    const all = await db.navMenu.findMany({ where: { deletedAt: null }, select: { id: true, parentId: true } });
    const ids = collectSubtreeIds(id, all);
    await db.navMenu.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
    await revalidateNav(menu.brandId);
    return { success: true, data: { deleted: ids.length } };
  } catch (e: any) {
    return { success: false, error: e?.message || "删除失败" };
  }
}

/** 切换菜单显示状态 */
export async function toggleNavVisibleAction(formData: FormData): Promise<NavActionResult> {
  try {
    await requireAdmin();
    const id = (formData.get("id") as string) || "";
    const isVisible = formData.get("isVisible") === "true";
    const menu = await db.navMenu.findUnique({ where: { id } });
    if (!menu || menu.deletedAt) return { success: false, error: "菜单不存在" };
    await db.navMenu.update({ where: { id }, data: { isVisible } });
    await revalidateNav(menu.brandId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "切换失败" };
  }
}

/** 批量更新排序与父子关系（拖拽 / 排序输入后调用） */
export async function batchSortNavAction(items: { id: string; sort: number; parentId?: string | null }[]): Promise<NavActionResult> {
  try {
    await requireAdmin();
    if (!Array.isArray(items) || items.length === 0) return { success: false, error: "无排序数据" };
    let brandId: string | null = null;
    for (const it of items) {
      const m = await db.navMenu.findUnique({ where: { id: it.id } });
      if (m) brandId = m.brandId;
      await db.navMenu.update({
        where: { id: it.id },
        data: { sort: it.sort, ...(it.parentId !== undefined ? { parentId: it.parentId } : {}) },
      });
    }
    await revalidateNav(brandId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "排序更新失败" };
  }
}
