"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";

export type InquiryState = {
  error?: string;
  success?: string;
  redirect?: string;
};

/**
 * 提交询价（前台）
 */
export async function submitInquiryAction(
  _prev: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  const name = (formData.get("name") as string)?.trim() || "";
  const company = (formData.get("company") as string)?.trim() || "";
  const contact = (formData.get("contact") as string)?.trim() || ""; // 联系方式（电话/微信，必填）
  const email = (formData.get("email") as string)?.trim() || ""; // 邮箱（选填）
  const message = (formData.get("message") as string)?.trim() || "";
  const productId = (formData.get("productId") as string) || "";
  const country = (formData.get("country") as string)?.trim() || "";

  if (!name) return { error: "请填写您的姓名/称呼" };
  if (!contact) return { error: "请填写联系方式（电话或微信）" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "邮箱格式不正确" };
  }
  if (message.length > 2000) return { error: "留言内容过长" };

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "";

  try {
    await db.inquiry.create({
      data: {
        name,
        company: company || null,
        contact,
        email: email || null,
        country: country || null,
        productId: productId || null,
        message: message || "（未填写留言）",
        status: "pending",
        notifyType: "in_site",
        sourceIp: ip || null,
      },
    });
  } catch (e: any) {
    return { error: e?.message || "提交失败，请稍后重试" };
  }

  return { success: "询价已提交，我们会尽快与您联系！", redirect: "/contact/success" };
}
