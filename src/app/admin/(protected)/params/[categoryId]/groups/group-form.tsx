"use client";

import { useActionState, useEffect, useState } from "react";
import { saveParamGroupAction, type ParamGroupState } from "./actions";

const initialState: ParamGroupState = {};

export default function ParamGroupForm({
  categoryId,
  group,
  onDone,
}: {
  categoryId: string;
  group: {
    id: string;
    code: string;
    sortOrder: number;
    translations: { locale: string; name: string }[];
  } | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveParamGroupAction, initialState);
  const t = Object.fromEntries(
    (group?.translations ?? []).map((tr) => [tr.locale, tr])
  );

  // 保存成功后自动关闭弹窗
  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={group?.id ?? ""} />
      <input type="hidden" name="categoryId" value={categoryId} />

      {state.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state.success && <div className="text-sm text-green-600">{state.success}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            分组代码 <span className="text-red-500">*</span>
          </label>
          <input
            name="code"
            defaultValue={group?.code ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            placeholder="如 BASIC"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">排序</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={group?.sortOrder ?? 0}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            中文名 <span className="text-red-500">*</span>
          </label>
          <input
            name="name_zh"
            defaultValue={t["zh"]?.name ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            placeholder="如 基本参数"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            English Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name_en"
            defaultValue={t["en"]?.name ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            placeholder="e.g. Basic"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {pending ? "保存中..." : group ? "保存修改" : "创建分组"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}
