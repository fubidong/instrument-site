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
