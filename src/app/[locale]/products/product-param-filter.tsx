"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { parseFreqMHz } from "@/lib/param-alias";

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

/** 是否为可用滑块的数值枚举参数（带宽/采样率等） */
function isSliderDef(def: FilterDef): boolean {
  if (def.type !== "enum") return false;
  const opts = parseOptions(def.options);
  return opts.some((o) => parseFreqMHz(o.value) !== null);
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

  if (filterDefs.length === 0) return null;

  // 顶层计算每个 def 的滑块档位（避免在 JSX 里调 hooks）
  const sliderStepsMap = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const def of filterDefs) {
      if (!isSliderDef(def)) continue;
      const set = new Set<number>();
      for (const o of parseOptions(def.options)) {
        const v = parseFreqMHz(o.value);
        if (v !== null) set.add(v);
      }
      const arr = [...set].sort((a, b) => a - b);
      if (arr.length > 1) m.set(def.id, arr);
    }
    return m;
  }, [filterDefs]);

  const labels = {
    paramFilter: isEn ? "Parameter Filter" : "参数筛选",
    support: isEn ? "Supported" : "支持",
    showMore: isEn ? "More Filters" : "更多筛选",
    collapse: isEn ? "Collapse" : "收起",
  };

  function push(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = {
      category: currentCategory,
      brand: currentBrand,
      line: currentLine,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  }

  /** 勾选 enum 立即筛选（保留其他参数） */
  function toggleEnum(def: FilterDef, value: string, checked: boolean) {
    const prev = (currentParams[`p_${def.key}`] ?? "").split(",").filter(Boolean);
    const next = checked ? [...new Set([...prev, value])] : prev.filter((v) => v !== value);
    push({ [`p_${def.key}`]: next.length ? next.join(",") : undefined });
  }

  /** 滑块变化立即筛选 */
  function onSlider(def: FilterDef, mhz: number) {
    push({ [`p_${def.key}_le`]: String(mhz) });
  }

  const visibleDefs = expanded ? filterDefs : filterDefs.slice(0, 4);

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">{labels.paramFilter}</div>
        <div className="flex items-center gap-2">
          {filterDefs.length > 4 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-sky-600 hover:underline"
            >
              {expanded ? labels.collapse : `${labels.showMore} (${filterDefs.length - 4})`}
            </button>
          )}
          {(currentParams[`p_${visibleDefs[0]?.key}_le`] ||
            Object.keys(currentParams).some((k) => k.startsWith("p_"))) && (
            <a
              href={`/products${currentCategory ? `?category=${currentCategory}` : ""}`}
              className="text-xs text-slate-400 hover:text-sky-600"
            >
              {isEn ? "Clear" : "清除"}
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleDefs.map((def) => {
          const opts = parseOptions(def.options);
          const sliderSteps = sliderStepsMap.get(def.id) ?? [];
          const isSlider = sliderSteps.length > 1;
          const curLe = currentParams[`p_${def.key}_le`] ? parseFloat(currentParams[`p_${def.key}_le`]!) : null;
          const sliderVal = curLe ?? (sliderSteps.length ? sliderSteps[sliderSteps.length - 1] : 0);
          const prevValues = (currentParams[`p_${def.key}`] ?? "").split(",").filter(Boolean);

          return (
            <div key={def.id} className="rounded-md border border-slate-100 bg-slate-50/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  {def.name}
                  {def.unit && <span className="ml-1 text-[10px] text-slate-400">({def.unit})</span>}
                </span>
              </div>

              {isSlider ? (
                <div>
                  <div className="mb-1 text-center text-sm font-semibold text-sky-700">
                    {curLe !== null ? formatMHz(curLe, isEn) : (isEn ? "Any" : "不限")}
                  </div>
                  <input
                    type="range"
                    min={sliderSteps[0]}
                    max={sliderSteps[sliderSteps.length - 1]}
                    step="auto"
                    value={sliderVal}
                    onChange={(e) => onSlider(def, parseFloat(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                  <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
                    <span>{formatMHz(sliderSteps[0], isEn)}</span>
                    <span>{formatMHz(sliderSteps[sliderSteps.length - 1], isEn)}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    {isEn ? "≤ selected value" : "≤ 选中值"}
                  </div>
                </div>
              ) : def.type === "number" || def.type === "range" ? (
                <div className="flex items-center gap-1.5">
                  <input
                    id={`p_${def.key}_min`}
                    type="number"
                    defaultValue={currentParams[`p_${def.key}_min`]}
                    placeholder={isEn ? "Min" : "最小"}
                    onChange={(e) => {
                      const v = e.target.value;
                      push({ [`p_${def.key}_min`]: v || undefined, [`p_${def.key}_max`]: currentParams[`p_${def.key}_max`] });
                    }}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    id={`p_${def.key}_max`}
                    type="number"
                    defaultValue={currentParams[`p_${def.key}_max`]}
                    placeholder={isEn ? "Max" : "最大"}
                    onChange={(e) => {
                      const v = e.target.value;
                      push({ [`p_${def.key}_max`]: v || undefined, [`p_${def.key}_min`]: currentParams[`p_${def.key}_min`] });
                    }}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  />
                </div>
              ) : def.type === "enum" ? (
                <div className="flex flex-wrap gap-1.5">
                  {opts.map((o) => {
                    const checked = prevValues.includes(o.value);
                    return (
                      <label
                        key={o.value}
                        className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] transition ${
                          checked
                            ? "border-sky-500 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-sky-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={`p_${def.key}`}
                          value={o.value}
                          checked={checked}
                          onChange={(e) => toggleEnum(def, o.value, e.target.checked)}
                          className="hidden"
                        />
                        {locale === "en" && o.label_en ? o.label_en : o.label_zh}
                      </label>
                    );
                  })}
                </div>
              ) : def.type === "boolean" ? (
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    defaultChecked={currentParams[`p_${def.key}`] === "1"}
                    onChange={(e) => push({ [`p_${def.key}`]: e.target.checked ? "1" : undefined })}
                    className="h-3.5 w-3.5 accent-sky-600"
                  />
                  {labels.support}
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatMHz(mhz: number, isEn: boolean): string {
  if (mhz >= 1000) return `${mhz / 1000} GHz`;
  return `${mhz} MHz`;
}
