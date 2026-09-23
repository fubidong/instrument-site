"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

export default function DocumentFilters({
  isEn,
  docTypes,
  brands,
  currentType,
  currentBrand,
  currentQ,
}: {
  isEn: boolean;
  docTypes: { value: string; label: string }[];
  brands: { id: string; code: string; name: string }[];
  currentType?: string;
  currentBrand?: string;
  currentQ: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(currentQ);

  const docTypeLabels: Record<string, string> = {
    datasheet: isEn ? "Datasheet" : "数据手册",
    user_manual: isEn ? "User Manual" : "用户手册",
    programming_manual: isEn ? "Programming Manual" : "编程手册",
    quick_guide: isEn ? "Quick Guide" : "快速指南",
    service_manual: isEn ? "Service Manual" : "服务手册",
    application_note: isEn ? "Application Note" : "应用笔记",
    other: isEn ? "Other" : "其他",
  };

  function apply(type?: string, brand?: string, query?: string) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (brand) params.set("brand", brand);
    if (query?.trim()) params.set("q", query.trim());
    router.push(`/documents${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const chipBase = "rounded-full border px-3 py-1 text-[13px] leading-5 transition-colors";
  const chipIdle = "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600";
  const chipActive = "border-sky-600 bg-sky-600 text-white";

  return (
    <div className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      {/* 品牌胶囊（位于全部类型上方） */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => apply(currentType, undefined, q)}
          className={`${chipBase} ${!currentBrand ? chipActive : chipIdle}`}
        >
          {isEn ? "All Brands" : "全部品牌"}
        </button>
        {brands.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => apply(currentType, b.id, q)}
            className={`${chipBase} ${
              currentBrand === b.id ? chipActive : chipIdle
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* 类型胶囊 + 搜索（右侧） */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => apply(undefined, currentBrand, q)}
          className={`${chipBase} ${!currentType ? chipActive : chipIdle}`}
        >
          {isEn ? "All Types" : "全部类型"}
        </button>
        {docTypes.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => apply(d.value, currentBrand, q)}
            className={`${chipBase} ${
              currentType === d.value ? chipActive : chipIdle
            }`}
          >
            {docTypeLabels[d.value]}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply(currentType, currentBrand, q);
            }}
            placeholder={isEn ? "Search title..." : "搜索标题..."}
            className="w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={() => apply(currentType, currentBrand, q)}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          >
            {isEn ? "Search" : "搜索"}
          </button>
        </div>
      </div>
    </div>
  );
}
