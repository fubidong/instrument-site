"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTransition } from "react";

export default function LocaleSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: string) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- params 结构兼容
        { pathname, params },
        { locale: next }
      );
    });
  }

  const isEn = locale === "en";

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
