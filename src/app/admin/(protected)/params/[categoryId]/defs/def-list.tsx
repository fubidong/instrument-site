"use client";

import { useState, useTransition } from "react";
import ParamDefForm from "./param-def-form";
import { deleteParamDefAction } from "./actions";
import Modal from "@/components/modal";

type GroupOption = { id: string; code: string; zhName: string; enName: string };
type ParamDef = {
  id: string;
  key: string;
  type: string;
  unit: string | null;
  isFilterable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  isHighlight: boolean;
  filterUI: string | null;
  sortOrder: number;
  options: string | null;
  minValue: number | null;
  maxValue: number | null;
  step: number | null;
  precision: number | null;
  paramGroupId: string;
  paramGroup: { code: string; translations: { locale: string; name: string }[] };
  translations: { locale: string; name: string; unit: string | null; description: string | null }[];
};
const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  number: { label: "数值", cls: "bg-sky-100 text-sky-700" },
  range: { label: "范围", cls: "bg-indigo-100 text-indigo-700" },
  enum: { label: "枚举", cls: "bg-amber-100 text-amber-700" },
  boolean: { label: "布尔", cls: "bg-emerald-100 text-emerald-700" },
  string: { label: "文本", cls: "bg-slate-100 text-slate-600" },
};
const FILTER_UI_BADGE: Record<string, { label: string; cls: string }> = {
  slider: { label: "滑块", cls: "bg-cyan-100 text-cyan-700" },
  multi: { label: "多选", cls: "bg-violet-100 text-violet-700" },
  single: { label: "单选", cls: "bg-amber-100 text-amber-700" },
};

export default function DefList({
  categoryId,
  groups,
  defs,
}: {
  categoryId: string;
  groups: GroupOption[];
  defs: ParamDef[];
}) {
  const [editing, setEditing] = useState<ParamDef | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete(d: ParamDef) {
    if (!confirm(`确定删除参数「${d.key}」？已有产品参数值将无法删除。`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", d.id);
      try {
        await deleteParamDefAction(fd);
      } catch (e: any) {
        alert(e.message || "删除失败");
      }
    });
  }

  const nameOf = (d: ParamDef, locale: string) =>
    d.translations.find((tr) => tr.locale === locale)?.name ?? "";
  const groupNameOf = (d: ParamDef, locale: string) =>
    d.paramGroup.translations.find((tr) => tr.locale === locale)?.name ?? d.paramGroup.code;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowNew(true);
          }}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          + 新增参数
        </button>
      </div>

      {showNew && (
        <Modal
          open={showNew}
          onClose={() => setShowNew(false)}
          title="新增参数定义"
        >
          <ParamDefForm
            categoryId={categoryId}
            groups={groups}
            def={null}
            onDone={() => setShowNew(false)}
          />
        </Modal>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        {defs.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            暂无参数定义，点击右上角新增
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">参数</th>
                <th className="px-4 py-3 font-medium">分组</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">中文名</th>
                <th className="px-4 py-3 font-medium">英文名</th>
                <th className="px-4 py-3 font-medium">标记</th>
                <th className="px-4 py-3 font-medium">筛选方式</th>
                <th className="px-4 py-3 font-medium">排序</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {defs.map((d) => {
                const badge = TYPE_BADGE[d.type] ?? TYPE_BADGE.string;
                const marks: string[] = [
                  d.isFilterable && "筛选",
                  d.isComparable && "对比",
                  d.isRequired && "必填",
                  d.isHighlight && "卖点",
                ].filter(Boolean) as string[];
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{d.key}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {groupNameOf(d, "zh")}
                      <span className="text-slate-300"> ({d.paramGroup.code})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{nameOf(d, "zh")}</td>
                    <td className="px-4 py-3 text-slate-600">{nameOf(d, "en")}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {marks.map((m) => (
                          <span
                            key={m}
                            className={`rounded px-1.5 py-0.5 text-xs ${
                              m === "卖点"
                                ? "bg-rose-100 text-rose-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {m}
                          </span>
                        ))}
                        {marks.length === 0 && <span className="text-xs text-slate-300">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {d.isFilterable ? (
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${(FILTER_UI_BADGE[d.filterUI ?? ""] ?? { label: "自动", cls: "bg-slate-100 text-slate-500" }).cls}`}>
                          {(FILTER_UI_BADGE[d.filterUI ?? ""] ?? { label: "自动", cls: "" }).label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{d.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowNew(false);
                            setEditing(d);
                          }}
                          className="text-sky-600 hover:underline"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d)}
                          disabled={pending}
                          className="text-red-500 hover:underline disabled:opacity-50"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal
          open={!!editing}
          onClose={() => setEditing(null)}
          title={`编辑参数 · ${editing.key}`}
          width="max-w-3xl"
        >
          <ParamDefForm
            categoryId={categoryId}
            groups={groups}
            def={editing}
            onDone={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
