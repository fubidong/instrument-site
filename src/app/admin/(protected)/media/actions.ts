"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * 删除单个素材（同时删除物理文件）
 */
export async function deleteAssetAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) return;

  await db.mediaAsset.delete({ where: { id } });
  try {
    const fullPath = path.join(process.cwd(), "public", asset.path);
    await unlink(fullPath);
  } catch {
    // 文件可能已不存在，忽略
  }
  revalidatePath("/admin/media");
}

/**
 * 批量删除素材
 */
export async function batchDeleteAssetsAction(formData: FormData) {
  await requireAdmin();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) return { error: "请选择要删除的素材" };

  const assets = await db.mediaAsset.findMany({ where: { id: { in: ids } } });
  await db.mediaAsset.deleteMany({ where: { id: { in: ids } } });

  for (const asset of assets) {
    try {
      const fullPath = path.join(process.cwd(), "public", asset.path);
      await unlink(fullPath);
    } catch {
      // 忽略
    }
  }
  revalidatePath("/admin/media");
  return { success: `已删除 ${assets.length} 个素材` };
}

// ============ 文件夹 ============

export type FolderActionResult = { error?: string; success?: string; folderId?: string };

/** 新建文件夹 */
export async function createFolderAction(formData: FormData): Promise<FolderActionResult> {
  await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  const parentId = (formData.get("parentId") as string) || null;
  if (!name) return { error: "请输入文件夹名称" };
  if (name.length > 50) return { error: "名称过长" };

  const folder = await db.mediaFolder.create({
    data: { name, parentId },
  });
  revalidatePath("/admin/media");
  return { success: "文件夹已创建", folderId: folder.id };
}

/** 重命名文件夹 */
export async function renameFolderAction(formData: FormData): Promise<FolderActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!id || !name) return { error: "参数错误" };
  if (name.length > 50) return { error: "名称过长" };

  await db.mediaFolder.update({ where: { id }, data: { name } });
  revalidatePath("/admin/media");
  return { success: "已重命名" };
}

/** 删除文件夹（其中的素材保留，移出文件夹） */
export async function deleteFolderAction(formData: FormData): Promise<FolderActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { error: "参数错误" };

  // 素材移出文件夹
  await db.mediaAsset.updateMany({ where: { folderId: id }, data: { folderId: null } });
  // 子文件夹的父级置空
  await db.mediaFolder.updateMany({ where: { parentId: id }, data: { parentId: null } });
  await db.mediaFolder.delete({ where: { id } });
  revalidatePath("/admin/media");
  return { success: "文件夹已删除（素材保留）" };
}

/** 移动素材到文件夹 */
export async function moveAssetsToFolderAction(formData: FormData): Promise<FolderActionResult> {
  await requireAdmin();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const folderId = (formData.get("folderId") as string) || null;
  if (ids.length === 0) return { error: "请选择要移动的素材" };

  await db.mediaAsset.updateMany({ where: { id: { in: ids } }, data: { folderId } });
  revalidatePath("/admin/media");
  return { success: `已移动 ${ids.length} 个素材` };
}

/**
 * 搜索素材库图片（供素材选择器弹窗使用）
 */
export async function searchMediaImagesAction(
  query: string
): Promise<{ items: { id: string; path: string; filename: string }[] }> {
  await requireAdmin();
  const q = query?.trim();
  const items = await db.mediaAsset.findMany({
    where: {
      kind: "image",
      ...(q ? { filename: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: { id: true, path: true, filename: true },
  });
  return { items };
}
