"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentFilters({
  docTypes,
  brands,
  currentType,
  currentBrand,
  currentQ,
}: {
  docTypes: { value: string; label: string }[];
  brands: { id: string; code: string; zhName: string }[];
  currentType?: string;
  currentBrand?: string;
  currentQ: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(currentQ);

  function apply(type?: string, brand?: string, query?: string) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (brand) params.set("brand", brand);
    if (query?.trim()) params.set("q", query.trim());
    router.push(`/documents${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* 类型 */}
        <button
          type="button"
          onClick={() => apply(undefined, currentBrand, q)}
          className={`rounded-md px-3 py-1.5 text-sm ${
            !currentType ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          全部类型
        </button>
        {docTypes.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => apply(d.value, currentBrand, q)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              currentType === d.value
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {d.label}
          </button>
        ))}

        {/* 品牌 */}
        <select
          value={currentBrand ?? ""}
          onChange={(e) => apply(currentType, e.target.value || undefined, q)}
          className="ml-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">全部品牌</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.zhName}
            </option>
          ))}
        </select>

        {/* 搜索 */}
        <div className="ml-auto flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply(currentType, currentBrand, q);
            }}
            placeholder="搜索标题..."
            className="w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={() => apply(currentType, currentBrand, q)}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          >
            搜索
          </button>
        </div>
      </div>
    </div>
  );
}
