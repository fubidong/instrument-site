"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CompareHydrator() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hasIds = searchParams.get("ids");
    if (hasIds) return;
    try {
      const list = JSON.parse(localStorage.getItem("compare_products") || "[]");
      if (list.length > 0) {
        const ids = list.map((p: { id: string }) => p.id).join(",");
        router.replace(`/compare?ids=${ids}`);
      }
    } catch {
      /* ignore */
    }
  }, [router, searchParams]);

  return null;
}
