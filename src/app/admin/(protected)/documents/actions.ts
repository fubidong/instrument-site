"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type DocumentFormState = {
  error?: string;
  success?: string;
  redirect?: string;
};

/**
 * 新增/更新资料文档
 */
export async function saveDocumentAction(
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const title = (formData.get("title") as string)?.trim() || "";
  const docType = (formData.get("docType") as string) || "other";
  const language = (formData.get("language") as string) || "zh";
  const version = (formData.get("version") as string)?.trim() || "";
  const filePath = (formData.get("filePath") as string)?.trim() || "";
  const fileSize = formData.get("fileSize")
    ? parseInt(formData.get("fileSize") as string)
    : null;
  const brandId = (formData.get("brandId") as string) || "";
  const productLineId = (formData.get("productLineId") as string) || "";
  const productId = (formData.get("productId") as string) || "";
  const isActive = formData.get("isActive") === "on";

  if (!title) return { error: "标题不能为空" };
  if (!filePath) return { error: "请上传文件" };

  try {
    const data = {
      title,
      docType: docType as "datasheet" | "user_manual" | "programming_manual" | "quick_guide" | "service_manual" | "application_note" | "other",
      language: language as "zh" | "en" | "ru" | "other",
      version: version || null,
      filePath,
      fileSize,
      brandId: brandId || null,
      productLineId: productLineId || null,
      productId: productId || null,
      isActive,
    };

    if (id) {
      await db.document.update({ where: { id }, data });
    } else {
      await db.document.create({ data });
    }
  } catch (e: any) {
    return { error: e?.message || "保存失败" };
  }

  revalidatePath("/admin/documents");
  return { success: "保存成功", redirect: "/admin/documents" };
}

/**
 * 删除资料文档
 */
export async function deleteDocumentAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await db.document.delete({ where: { id } });
  revalidatePath("/admin/documents");
}
