"use client";

import { useActionState, useEffect, useState } from "react";
import FileUpload from "@/components/admin/file-upload";
import { saveCategoryAction, type CategoryFormState } from "./actions";

const initialState: CategoryFormState = {};

type CategoryOption = {
  id: string;
  code: string;
  name: string;
  depth: number;
};

export default function CategoryForm({
  category,
  categories,
}: {
  category: {
    id: string;
    code: string;
    parentId: string | null;
    icon: string | null;
    sortOrder: number;
    translations: {
      locale: string;
      name: string;
      description: string | null;
    }[];
  } | null;
  categories: CategoryOption[];
}) {
  const [state, formAction, pending] = useActionState(saveCategoryAction, initialState);
  const [icon, setIcon] = useState(category?.icon ?? "");

  useEffect(() => {
    if (state.redirect) window.location.href = state.redirect;
  }, [state.redirect]);

  const t = Object.fromEntries(
    (category?.translations ?? []).map((tr) => [tr.locale, tr])
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <input type="hidden" name="icon" value={icon} />
      {category && <input type="hidden" name="code" value={category.code} />}

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

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">基础信息</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              类别代码 <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              defaultValue={category?.code ?? ""}
              required
              disabled={!!category}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-50"
              placeholder="如 OSCILLOSCOPE"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">父类别</label>
            <select
              name="parentId"
              defaultValue={category?.parentId ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              <option value="">无（顶级类别）</option>
              {categories
                .filter((c) => c.id !== category?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {"　".repeat(c.depth)}{c.name} ({c.code})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">排序</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={category?.sortOrder ?? 0}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">图标</label>
            <FileUpload kind="image" value={icon} onChange={setIcon} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">中文内容</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              类别名称（中文）<span className="text-red-500">*</span>
            </label>
            <input
              name="name_zh"
              defaultValue={t["zh"]?.name ?? ""}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="如 示波器"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">描述（中文）</label>
            <textarea
              name="desc_zh"
              defaultValue={t["zh"]?.description ?? ""}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">English Content</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Category Name (EN) <span className="text-red-500">*</span>
            </label>
            <input
              name="name_en"
              defaultValue={t["en"]?.name ?? ""}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="e.g. Oscilloscope"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description (EN)</label>
            <textarea
              name="desc_en"
              defaultValue={t["en"]?.description ?? ""}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存类别"}
        </button>
      </div>
    </form>
  );
}
