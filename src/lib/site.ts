import { cache } from "react";
import { db } from "./db";

/** 从翻译数组取指定 locale 的值 */
export function t<T extends { locale: string }>(
  translations: T[] | undefined,
  locale: string,
  key: keyof T
): string {
  const item = translations?.find((tr) => tr.locale === locale) ?? translations?.[0];
  return item ? String(item[key] ?? "") : "";
}

/** 站点设置读取（缓存） */
export const getSiteSettings = cache(async (locale: string = "zh") => {
  const rows = await db.siteSetting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[`${r.key}${r.locale ? ":" + r.locale : ""}`] = r.value;
  }
  return {
    siteName: map["site_name"] || map[`site_name:${locale}`] || map["site_name:zh"] || "仪器仪表站",
    siteNameEn: map["site_name:en"] || "Test & Measurement",
    phone: map["contact_phone"] || "",
    phoneEnabled: map["contact_phone_enabled"] !== "0", // 详情页右侧"咨询热线"显示开关（默认开启）
    email: map["contact_email"] || "",
    address: map["contact_address"] || "",
    companyIntro: map[`company_intro:${locale}`] || map["company_intro"] || map["company_intro:zh"] || "",
  };
});

/** 前台主导航类别（有启用产品的顶层类别）—— 仅全站品类（brandId = null） */
export const getSiteCategories = cache(async (locale: string = "zh") => {
  const categories = await db.category.findMany({
    where: { brandId: null },
    include: { translations: true },
    orderBy: { sortOrder: "asc" },
  });
  return categories.map((c) => ({
    id: c.id,
    code: c.code,
    zhName: t(c.translations, "zh", "name") || c.code,
    enName: t(c.translations, "en", "name") || c.code,
    name: t(c.translations, locale, "name") || t(c.translations, "zh", "name") || c.code,
    parentId: c.parentId,
    icon: c.icon,
    showInNav: c.showInNav,
  }));
});

/** 前台启用品牌列表 */
export const getSiteBrands = cache(async (locale: string = "zh") => {
  const brands = await db.brand.findMany({
    where: { isActive: true },
    include: { translations: true },
    orderBy: { sortOrder: "asc" },
  });
  return brands.map((b) => ({
    id: b.id,
    code: b.code,
    zhName: t(b.translations, "zh", "name") || b.code,
    enName: t(b.translations, "en", "name") || b.code,
    name: t(b.translations, locale, "name") || t(b.translations, "zh", "name") || b.code,
    logo: b.logo,
    website: b.website,
    sortOrder: b.sortOrder,
  }));
});
