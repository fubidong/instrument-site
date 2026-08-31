"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FilterDef = {
  id: string;
  key: string;
  type: string;
  unit: string | null;
  options: string | null;
  zhName: string;
  enName: string;
};

function parseOptions(raw: string | null): { value: string; label_zh: string; label_en: string }[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function ProductFilters({
  categories,
  currentCategory,
  filterDefs,
  currentParams,
  brands,
  currentBrand,
  currentQ,
}: {
  categories: { id: string; code: string; zhName: string; parentId: string | null }[];
  currentCategory?: string;
  filterDefs: FilterDef[];
  currentParams: Record<string, string | undefined>;
  brands: { id: string; code: string; zhName: string }[];
  currentBrand?: string;
  currentQ: string;
}) {
  const router = useRouter();
  const [tempQ, setTempQ] = useState(currentQ);

  const topCategories = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    // 保留 category 和 brand（除非覆盖）
    const merged = {
      category: currentCategory,
      brand: currentBrand,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return `/products${params.toString() ? `?${params.toString()}` : ""}`;
  }

  function applyFilters() {
    // 收集当前参数筛选控件的值
    const params = new URLSearchParams();
    if (currentCategory) params.set("category", currentCategory);
    if (currentBrand) params.set("brand", currentBrand);

    for (const def of filterDefs) {
      if (def.type === "number" || def.type === "range") {
        const minInput = document.getElementById(`p_${def.key}_min`) as HTMLInputElement;
        const maxInput = document.getElementById(`p_${def.key}_max`) as HTMLInputElement;
        if (minInput?.value) params.set(`p_${def.key}_min`, minInput.value);
        if (maxInput?.value) params.set(`p_${def.key}_max`, maxInput.value);
      } else if (def.type === "enum") {
        const checks = document.querySelectorAll(`input[name="p_${def.key}"]:checked`);
        const values = Array.from(checks).map((c) => (c as HTMLInputElement).value);
        if (values.length > 0) params.set(`p_${def.key}`, values.join(","));
      } else if (def.type === "boolean") {
        const check = document.getElementById(`p_${def.key}`) as HTMLInputElement;
        if (check?.checked) params.set(`p_${def.key}`, "1");
      }
    }
    if (tempQ.trim()) params.set("q", tempQ.trim());
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">产品类别</div>
        <div className="space-y-1">
          <a
            href="/products"
            className={`block rounded px-3 py-1.5 text-sm ${
              !currentCategory ? "bg-sky-50 font-medium text-sky-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            全部产品
          </a>
          {topCategories.map((c) => {
            const subs = childrenOf(c.id);
            const active = currentCategory === c.code;
            return (
              <div key={c.id}>
                <a
                  href={`/products?category=${c.code}`}
                  className={`block rounded px-3 py-1.5 text-sm ${
                    active ? "bg-sky-50 font-medium text-sky-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {c.zhName}
                </a>
                {subs.length > 0 && (
                  <div className="ml-3 border-l border-slate-100 pl-2">
                    {subs.map((s) => (
                      <a
                        key={s.id}
                        href={`/products?category=${s.code}`}
                        className={`block rounded px-3 py-1 text-xs ${
                          currentCategory === s.code
                            ? "bg-sky-50 font-medium text-sky-700"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {s.zhName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 品牌筛选 */}
        <div className="mb-3 mt-6 text-sm font-semibold text-slate-800">品牌</div>
        <div className="space-y-1">
          <a
            href={buildUrl({ brand: undefined })}
            className={`block rounded px-3 py-1.5 text-sm ${
              !currentBrand ? "bg-sky-50 font-medium text-sky-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            全部品牌
          </a>
          {brands.map((b) => (
            <a
              key={b.id}
              href={buildUrl({ brand: b.id })}
              className={`block rounded px-3 py-1.5 text-sm ${
                currentBrand === b.id
                  ? "bg-sky-50 font-medium text-sky-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {b.zhName}
            </a>
          ))}
        </div>
      </div>

      {/* 动态参数筛选器 */}
      {filterDefs.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-slate-800">参数筛选</div>
          <div className="space-y-4">
            {filterDefs.map((def) => {
              const prevMin = currentParams[`p_${def.key}_min`];
              const prevMax = currentParams[`p_${def.key}_max`];
              const prevValues = currentParams[`p_${def.key}`]?.split(",") ?? [];
              const opts = parseOptions(def.options);

              return (
                <div key={def.id}>
                  <div className="mb-1.5 text-sm font-medium text-slate-700">
                    {def.zhName}
                    {def.unit && <span className="ml-1 text-xs text-slate-400">({def.unit})</span>}
                  </div>
                  {def.type === "number" || def.type === "range" ? (
                    <div className="flex items-center gap-2">
                      <input
                        id={`p_${def.key}_min`}
                        type="number"
                        defaultValue={prevMin}
                        placeholder="最小"
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                      <span className="text-slate-400">~</span>
                      <input
                        id={`p_${def.key}_max`}
                        type="number"
                        defaultValue={prevMax}
                        placeholder="最大"
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                  ) : def.type === "enum" ? (
                    <div className="space-y-1">
                      {opts.map((o) => (
                        <label key={o.value} className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            name={`p_${def.key}`}
                            value={o.value}
                            defaultChecked={prevValues.includes(o.value)}
                            className="h-3.5 w-3.5"
                          />
                          {o.label_zh}
                          {o.label_en && <span className="text-xs text-slate-400">({o.label_en})</span>}
                        </label>
                      ))}
                    </div>
                  ) : def.type === "boolean" ? (
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        id={`p_${def.key}`}
                        type="checkbox"
                        defaultChecked={currentParams[`p_${def.key}`] === "1"}
                        className="h-3.5 w-3.5"
                      />
                      支持
                    </label>
                  ) : null}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={applyFilters}
            className="mt-4 w-full rounded-md bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            应用筛选
          </button>
        </div>
      )}

      {/* 搜索 */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <input
          value={tempQ}
          onChange={(e) => setTempQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const params = new URLSearchParams();
              if (currentCategory) params.set("category", currentCategory);
              if (currentBrand) params.set("brand", currentBrand);
              if (tempQ.trim()) params.set("q", tempQ.trim());
              router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
            }
          }}
          placeholder="搜索型号/名称..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
      </div>
    </aside>
  );
}
