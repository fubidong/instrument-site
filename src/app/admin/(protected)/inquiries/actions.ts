"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type InquiryActionState = { error?: string; success?: string };

const STATUSES = ["pending", "quoted", "closed_won", "closed_lost"] as const;

/** 更新询价状态 */
export async function updateInquiryStatusAction(
  _prev: InquiryActionState,
  formData: FormData
): Promise<InquiryActionState> {
  await requireAdmin();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (!id || !STATUSES.includes(status as any)) return { error: "参数错误" };

  await db.inquiry.update({ where: { id }, data: { status: status as any } });
  revalidatePath("/admin/inquiries");
  return { success: "状态已更新" };
}

/** 更新备注 */
export async function updateInquiryNoteAction(
  _prev: InquiryActionState,
  formData: FormData
): Promise<InquiryActionState> {
  await requireAdmin();
  const id = formData.get("id") as string;
  const adminNote = (formData.get("adminNote") as string)?.trim() ?? "";
  if (!id) return { error: "参数错误" };

  await db.inquiry.update({ where: { id }, data: { adminNote: adminNote || null } });
  revalidatePath("/admin/inquiries");
  return { success: "备注已保存" };
}

/** 批量删除 */
export async function batchDeleteInquiriesAction(
  _prev: InquiryActionState,
  formData: FormData
): Promise<InquiryActionState> {
  await requireAdmin();
  const ids = (formData.get("ids") as string)?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) return { error: "未选择询价" };

  await db.inquiry.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/inquiries");
  return { success: `已删除 ${ids.length} 条询价` };
}
