import { headers } from "next/headers";

export type BrandLocale = "zh" | "en";

/** 从 middleware 设置的 header 读取品牌站 locale（默认 zh） */
export async function getBrandLocale(): Promise<BrandLocale> {
  const h = await headers();
  const l = h.get("x-brand-locale");
  return l === "en" ? "en" : "zh";
}

/** 品牌站对外路径（middleware 会把 /siglent/... rewrite 到 /brand/siglent/...） */
export function brandPath(code: string, locale: BrandLocale, rest = ""): string {
  const base = `/${code.toLowerCase()}`;
  const l = locale === "en" ? "/en" : "";
  return `${base}${l}${rest}`;
}
