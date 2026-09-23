"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

export type SupportTypeTab = { value: string; label: string };
export type SupportBrand = { id: string; name: string };

/**
 * 支持中心筛选条（客户端组件）：
 * - 顶部 3 个板块 Tab（解决方案 / 技术文章 / 常见问题）
 * - 品牌胶囊一行（全部品牌 + 各活跃品牌）
 * 切换时保留其它 query（brand / q），样式照抄 product-filters 的 chip 三件套。
 */
export default function SupportFilters({
  locale,
  tabs,
  brands,
  currentType,
  currentBrand,
  currentQ,
}: {
  locale: string;
  tabs: SupportTypeTab[];
  brands: SupportBrand[];
  currentType: string;
  currentBrand?: string;
  currentQ: string;
}) {
  const router = useRouter();
  const [tempQ, setTempQ] = useState(currentQ);
  const isEn = locale === "en";

  function buildPath(overrides: Record<string, string | undefined>) {
    const merged = { type: currentType, brand: currentBrand, q: currentQ, ...overrides };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return `/support${qs ? `?${qs}` : ""}`;
  }

  function search() {
    router.push(buildPath({ q: tempQ.trim() || undefined }));
  }

  const allBrandsLabel = isEn ? "All Brands" : "全部品牌";

  // 与 product-filters 完全一致的胶囊三件套（蓝白商务风，选中态 sky-600 实心）
  const chipBase = "rounded-full border px-3 py-1 text-[13px] leading-5 transition-colors";
  const chipIdle = "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600";
  const chipActive = "border-sky-600 bg-sky-600 text-white";

  return (
    <div className="space-y-3">
      {/* 板块 Tab 胶囊 */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <a
            key={t.value}
            href={buildPath({ type: t.value })}
            className={`${chipBase} ${currentType === t.value ? chipActive : chipIdle}`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* 品牌胶囊 + 搜索 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <a
          href={buildPath({ brand: undefined })}
          className={`${chipBase} ${!currentBrand ? chipActive : chipIdle}`}
        >
          {allBrandsLabel}
        </a>
        {brands.map((b) => (
          <a
            key={b.id}
            href={buildPath({ brand: b.id })}
            className={`${chipBase} ${currentBrand === b.id ? chipActive : chipIdle}`}
          >
            {b.name}
          </a>
        ))}
        <input
          value={tempQ}
          onChange={(e) => setTempQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
          placeholder={isEn ? "Search articles..." : "搜索文章..."}
          className="ml-1 w-44 rounded-full border border-slate-300 px-3 py-1 text-[13px] outline-none focus:border-sky-500"
        />
      </div>
    </div>
  );
}
