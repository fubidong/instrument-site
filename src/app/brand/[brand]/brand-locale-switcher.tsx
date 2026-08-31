"use client";

import { usePathname, useRouter } from "next/navigation";

/** 品牌站语言切换：/siglent ↔ /siglent/en（保留子路径） */
export default function BrandLocaleSwitcher({
  brandCode,
  locale,
}: {
  brandCode: string;
  locale: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isEn = locale === "en";

  function switchTo(next: string) {
    if (next === locale) return;
    // 当前路径去掉 /en 前缀，再决定加不加
    let rest = pathname.replace(/^\/[^/]+/, ""); // 去掉 /brand/siglent
    let newPath = `/${brandCode}${rest}`;
    if (next === "en") {
      newPath = `/${brandCode}/en${rest}`;
    }
    router.push(newPath);
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={() => switchTo("zh")}
        className={`rounded px-1.5 py-0.5 ${!isEn ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"}`}
      >
        中文
      </button>
      <span className="text-slate-600">/</span>
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={`rounded px-1.5 py-0.5 ${isEn ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"}`}
      >
        EN
      </button>
    </div>
  );
}
