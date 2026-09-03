"use client";

import { useState } from "react";

export type ParamDefOption = {
  id: string;
  key: string;
  type: string;
  unit: string | null;
  isRequired: boolean;
  isHighlight: boolean;
  options: string | null;
  translations: { locale: string; name: string; unit: string | null }[];
};

export type ParamGroupWithDefs = {
  id: string;
  code: string;
  sortOrder: number;
  translations: { locale: string; name: string }[];
  paramDefs: ParamDefOption[];
};

type ParamValue = {
  valueNumber: number | null;
  valueMin: number | null;
  valueMax: number | null;
  valueString: string | null;
  valueBoolean: boolean | null;
  isHighlight: boolean | null;
};

export default function ProductParamsForm({
  groups,
  values,
}: {
  groups: ParamGroupWithDefs[];
  values: Record<string, ParamValue>;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const nameOf = (d: ParamDefOption, locale: string) =>
    d.translations.find((tr) => tr.locale === locale)?.name ?? d.key;
  const unitOf = (d: ParamDefOption, locale: string) =>
    d.translations.find((tr) => tr.locale === locale)?.unit ?? d.unit ?? "";
  const groupNameOf = (g: ParamGroupWithDefs, locale: string) =>
    g.translations.find((tr) => tr.locale === locale)?.name ?? g.code;

  function parseOptions(raw: string | null): { value: string; label_zh: string; label_en: string }[] {
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  // 分组默认折叠（紧凑），可通过展开全部切换
  const visibleGroups = groups.filter((g) => g.paramDefs.length > 0);
  const totalParams = visibleGroups.reduce((sum, g) => sum + g.paramDefs.length, 0);
  const allExpanded = visibleGroups.length > 0 && visibleGroups.every((g) => expanded[g.id] === true);

  function toggleAll() {
    if (allExpanded) {
      const next: Record<string, boolean> = {};
      visibleGroups.forEach((g) => (next[g.id] = false));
      setExpanded(next);
    } else {
      const next: Record<string, boolean> = {};
      visibleGroups.forEach((g) => (next[g.id] = true));
      setExpanded(next);
    }
  }

  return (
    <div className="space-y-6">
      {groups.length === 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          该类别尚未定义参数模板，请先到「参数模板」为类别添加参数。
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              共 {visibleGroups.length} 个分组 · {totalParams} 个参数
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:border-sky-400 hover:text-sky-600"
            >
              {allExpanded ? "全部收起" : "全部展开"}
            </button>
          </div>
        {visibleGroups.map((group) => {
          const defs = group.paramDefs;
          if (defs.length === 0) return null;
          const isOpen = expanded[group.id] === true;
          return (
            <section
              key={group.id}
              className="rounded-lg border border-slate-200 bg-white"
            >
              <button
                type="button"
                onClick={() => setExpanded((s) => ({ ...s, [group.id]: !isOpen }))}
                className="flex w-full items-center justify-between px-5 py-3 text-left"
              >
                <span className="text-sm font-semibold text-slate-700">
                  {groupNameOf(group, "zh")}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {groupNameOf(group, "en")} ({defs.length})
                  </span>
                </span>
                <span className="text-xs text-slate-400">{isOpen ? "收起 ▲" : "展开 ▼"}</span>
              </button>

              {/* 折叠时参数 input 保留在 DOM（hidden 隐藏）以保证保存时全部提交 */}
              <div className={`divide-y divide-slate-100 border-t border-slate-100 ${isOpen ? "" : "hidden"}`}>
                {defs.map((d) => {
                    const v = values[d.id];
                    const name = nameOf(d, "zh");
                    const enName = nameOf(d, "en");
                    const unit = unitOf(d, "en");
                    const isRequired = d.isRequired;
                    const opts = parseOptions(d.options);

                    return (
                      <div key={d.id} className="grid grid-cols-1 gap-2 px-5 py-3 sm:grid-cols-4 sm:items-center">
                        <div className="sm:col-span-1">
                          <div className="text-sm font-medium text-slate-700">
                            {name}
                            {isRequired && <span className="text-red-500"> *</span>}
                            {d.isHighlight && (
                              <span className="ml-1 rounded bg-rose-100 px-1 text-xs text-rose-600">
                                卖点
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{enName}</div>
                        </div>
                        <div className="sm:col-span-2">
                          {d.type === "number" && (
                            <div className="flex items-center gap-2">
                              <input
                                name={`param_${d.id}_value`}
                                type="number"
                                defaultValue={v?.valueNumber ?? ""}
                                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
                              />
                              {unit && <span className="text-xs text-slate-400">{unit}</span>}
                            </div>
                          )}
                          {d.type === "range" && (
                            <div className="flex items-center gap-2">
                              <input
                                name={`param_${d.id}_min`}
                                type="number"
                                placeholder="min"
                                defaultValue={v?.valueMin ?? ""}
                                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
                              />
                              <span className="text-slate-400">~</span>
                              <input
                                name={`param_${d.id}_max`}
                                type="number"
                                placeholder="max"
                                defaultValue={v?.valueMax ?? ""}
                                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
                              />
                              {unit && <span className="text-xs text-slate-400">{unit}</span>}
                            </div>
                          )}
                          {d.type === "enum" && (
                            <select
                              name={`param_${d.id}_value`}
                              defaultValue={v?.valueString ?? ""}
                              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
                            >
                              <option value="">请选择</option>
                              {opts.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label_zh}
                                  {o.label_en && o.label_en !== o.label_zh ? ` / ${o.label_en}` : ""}
                                </option>
                              ))}
                            </select>
                          )}
                          {d.type === "boolean" && (
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-1.5 text-sm text-slate-600">
                                <input
                                  type="radio"
                                  name={`param_${d.id}_value`}
                                  value="true"
                                  defaultChecked={v?.valueBoolean === true}
                                  className="h-4 w-4"
                                />
                                是
                              </label>
                              <label className="flex items-center gap-1.5 text-sm text-slate-600">
                                <input
                                  type="radio"
                                  name={`param_${d.id}_value`}
                                  value="false"
                                  defaultChecked={v?.valueBoolean === false}
                                  className="h-4 w-4"
                                />
                                否
                              </label>
                            </div>
                          )}
                          {d.type === "string" && (
                            <input
                              name={`param_${d.id}_value`}
                              defaultValue={v?.valueString ?? ""}
                              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
                            />
                          )}
                        </div>
                        <div className="sm:col-span-1 sm:justify-self-end">
                          <label className="flex items-center gap-1.5 text-xs text-slate-500">
                            <input
                              type="checkbox"
                              name={`param_${d.id}_hl`}
                              defaultChecked={v?.isHighlight === true}
                              className="h-3.5 w-3.5"
                            />
                            卖点高亮
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
            </section>
          );
        })}
        </>
      )}
    </div>
  );
}
