"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type SettingsFormState = { error?: string; success?: string };

/** 写入（或新建）一条站点设置；locale 可为 null */
async function upsertSetting(key: string, value: string, locale: string | null) {
  const v = value.trim();
  const existing = await db.siteSetting.findFirst({ where: { key, locale } });
  if (existing) {
    await db.siteSetting.update({ where: { id: existing.id }, data: { value: v } });
  } else {
    await db.siteSetting.create({ data: { key, value: v, locale } });
  }
}

/**
 * 保存站点基础设置：站点名称（中英）、联系电话、邮箱、地址、公司简介（中英）
 */
export async function saveSettingsAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();

  const siteNameZh = (formData.get("site_name_zh") as string)?.trim() || "";
  const siteNameEn = (formData.get("site_name_en") as string)?.trim() || "";
  const phone = (formData.get("contact_phone") as string)?.trim() || "";
  const phoneEnabled = formData.get("contact_phone_enabled") === "on" ? "1" : "0";
  const email = (formData.get("contact_email") as string)?.trim() || "";
  const address = (formData.get("contact_address") as string)?.trim() || "";
  const introZh = (formData.get("company_intro_zh") as string)?.trim() || "";
  const introEn = (formData.get("company_intro_en") as string)?.trim() || "";
  const logo = (formData.get("site_logo") as string)?.trim() || "";
  const favicon = (formData.get("site_favicon") as string)?.trim() || "";
  const footerZh = (formData.get("footer_text_zh") as string)?.trim() || "";
  const footerEn = (formData.get("footer_text_en") as string)?.trim() || "";

  if (!siteNameZh && !siteNameEn) return { error: "请至少填写一种语言的站点名称" };

  try {
    await upsertSetting("site_name", siteNameZh, "zh");
    await upsertSetting("site_name", siteNameEn, "en");
    await upsertSetting("contact_phone", phone, null);
    await upsertSetting("contact_phone_enabled", phoneEnabled, null);
    await upsertSetting("contact_email", email, null);
    await upsertSetting("contact_address", address, null);
    await upsertSetting("company_intro", introZh, "zh");
    await upsertSetting("company_intro", introEn, "en");
    await upsertSetting("site_logo", logo, null);
    await upsertSetting("site_favicon", favicon, null);
    await upsertSetting("footer_text", footerZh, "zh");
    await upsertSetting("footer_text", footerEn, "en");
    revalidatePath("/admin/settings");
  } catch (e) {
    return { error: `保存失败：${e instanceof Error ? e.message : String(e)}` };
  }

  return { success: "站点设置已保存" };
}
