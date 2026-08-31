"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type FilterField = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

/**
 * 通用后台列表筛选栏（客户端组件）
 * 用法：传入字段定义 + 基础路径，自动拼接 URL 参数
 */
export default function ListFilterBar({
  basePath,
  fields,
  searchPlaceholder,
  searchKey = "q",
}: {
  basePath: string;
  fields: FilterField[];
  searchPlaceholder?: string;
  searchKey?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value === "all" || value === "") params.delete(key);
      else params.set(key, value);
    }
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      {fields.map((f) => (
        <select
          key={f.key}
          defaultValue={searchParams.get(f.key) ?? "all"}
          onChange={(e) => router.push(buildParams({ [f.key]: e.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        >
          <option value="all">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      <input
        defaultValue={searchParams.get(searchKey) ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            router.push(buildParams({ [searchKey]: (e.target as HTMLInputElement).value.trim() }));
          }
        }}
        placeholder={searchPlaceholder ?? "搜索..."}
        className="w-52 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
      />
      <button
        type="button"
        onClick={() => router.push(basePath)}
        className="text-sm text-slate-400 hover:text-slate-600"
      >
        清除筛选
      </button>
    </div>
  );
}
