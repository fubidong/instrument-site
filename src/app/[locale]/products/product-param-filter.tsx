"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

type FilterDef = {
  id: string;
  key: string;
  type: string;
  unit: string | null;
  options: string | null;
  name: string;
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

export default function ProductParamFilter({
  locale,
  filterDefs,
  currentParams,
  currentCategory,
  currentBrand,
  currentLine,
}: {
  locale: string;
  filterDefs: FilterDef[];
  currentParams: Record<string, string | undefined>;
  currentCategory?: string;
  currentBrand?: string;
  currentLine?: string;
}) {
  const router = useRouter();
  const isEn = locale === "en";
  const [expanded, setExpanded] = useState(false);
  const [tempQ, setTempQ] = useState("");

  if (filterDefs.length === 0) return null;

  const labels = {
    paramFilter: isEn ? "Parameter Filter" : "参数筛选",
    apply: isEn ? "Apply Filters" : "应用筛选",
    min: isEn ? "Min" : "最小",
    max: isEn ? "Max" : "最大",
    support: isEn ? "Supported" : "支持",
    showMore: isEn ? "More Filters" : "更多筛选",
    collapse: isEn ? "Collapse" : "收起",
  };

  function applyFilters() {
    const params = new URLSearchParams();
    if (currentCategory) params.set("category", currentCategory);
    if (currentBrand) params.set("brand", currentBrand);
    if (currentLine) params.set("line", currentLine);

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

  const visibleDefs = expanded ? filterDefs : filterDefs.slice(0, 3);

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">{labels.paramFilter}</div>
        {filterDefs.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-sky-600 hover:underline"
          >
            {expanded ? labels.collapse : `${labels.showMore} (${filterDefs.length - 3})`}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleDefs.map((def) => {
          const prevMin = currentParams[`p_${def.key}_min`];
          const prevMax = currentParams[`p_${def.key}_max`];
          const prevValues = currentParams[`p_${def.key}`]?.split(",") ?? [];
          const opts = parseOptions(def.options);
          return (
            <div key={def.id} className="rounded-md border border-slate-100 bg-slate-50/50 p-3">
              <div className="mb-2 text-xs font-medium text-slate-600">
                {def.name}
                {def.unit && <span className="ml-1 text-[10px] text-slate-400">({def.unit})</span>}
              </div>
              {def.type === "number" || def.type === "range" ? (
                <div className="flex items-center gap-1.5">
                  <input
                    id={`p_${def.key}_min`}
                    type="number"
                    defaultValue={prevMin}
                    placeholder={labels.min}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    id={`p_${def.key}_max`}
                    type="number"
                    defaultValue={prevMax}
                    placeholder={labels.max}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  />
                </div>
              ) : def.type === "enum" ? (
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {opts.map((o) => (
                    <label key={o.value} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        name={`p_${def.key}`}
                        value={o.value}
                        defaultChecked={prevValues.includes(o.value)}
                        className="h-3 w-3"
                      />
                      {locale === "en" && o.label_en ? o.label_en : o.label_zh}
                    </label>
                  ))}
                </div>
              ) : def.type === "boolean" ? (
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    id={`p_${def.key}`}
                    type="checkbox"
                    defaultChecked={currentParams[`p_${def.key}`] === "1"}
                    className="h-3 w-3"
                  />
                  {labels.support}
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        <input
          value={tempQ}
          onChange={(e) => setTempQ(e.target.value)}
          placeholder={isEn ? "Search model..." : "搜索型号..."}
          className="w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        />
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-500"
        >
          {labels.apply}
        </button>
      </div>
    </div>
  );
}
