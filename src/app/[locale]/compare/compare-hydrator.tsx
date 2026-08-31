"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

export default function CompareHydrator() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hasIds = searchParams.get("ids");
    if (hasIds) return;
    try {
      const list = JSON.parse(localStorage.getItem("compare_products") || "[]");
      if (list.length > 0) {
        const ids = list.map((p: { id: string }) => p.id).join(",");
        router.replace(`/${locale}/compare?ids=${ids}`);
      }
    } catch {
      /* ignore */
    }
  }, [router, searchParams, locale]);

  return null;
}
