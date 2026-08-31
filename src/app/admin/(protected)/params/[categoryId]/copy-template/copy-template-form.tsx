"use client";

import { useActionState, useEffect, useState } from "react";
import { copyTemplateAction, type CopyTemplateState } from "./actions";

const initialState: CopyTemplateState = {};

export default function CopyTemplateForm({
  targetCategoryId,
  targetName,
  options,
}: {
  targetCategoryId: string;
  targetName: string;
  options: { id: string; name: string; code: string; groupCount: number; defCount: number }[];
}) {
  const [state, formAction, pending] = useActionState(copyTemplateAction, initialState);
  const [sourceId, setSourceId] = useState("");

  useEffect(() => {
    if (state.redirect) window.location.href = state.redirect;
  }, [state.redirect]);

  const selected = options.find((o) => o.id === sourceId);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <input type="hidden" name="targetCategoryId" value={targetCategoryId} />

      {state.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
          {state.success}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          选择要复制的源类别
        </label>
        <select
          name="sourceCategoryId"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
        >
          <option value="">请选择源类别</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.code}) — {o.groupCount} 分组 / {o.defCount} 参数
            </option>
          ))}
        </select>
        {options.length === 0 && (
          <p className="mt-2 text-sm text-amber-600">没有其他类别可复制。</p>
        )}

        {selected && (
          <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            将把「{selected.name}」的 {selected.groupCount} 个分组、{selected.defCount} 个参数
            完整复制到「{targetName}」。
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || !sourceId}
        className="rounded-md bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {pending ? "复制中..." : "开始复制"}
      </button>
    </form>
  );
}
