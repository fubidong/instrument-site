"use client";

import { useActionState, useEffect, useState } from "react";
import { saveProductLineAction, type ProductLineFormState } from "./actions";

const initialState: ProductLineFormState = {};

export default function ProductLineForm({
  line,
  brands,
  categories,
}: {
  line: {
    id: string;
    brandId: string;
    categoryId: string;
    code: string;
    sortOrder: number;
    isActive: boolean;
    translations: { locale: string; name: string; description: string | null }[];
  } | null;
  brands: { id: string; zhName: string; enName: string }[];
  categories: { id: string; zhName: string; enName: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveProductLineAction, initialState);
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [mounted, setMounted] = useState<{ zh: boolean; en: boolean }>({ zh: true, en: false });

  function switchLang(l: "zh" | "en") {
    setMounted((m) => ({ ...m, [l]: true }));
    setLang(l);
  }

  useEffect(() => {
    if (state.redirect) window.location.href = state.redirect;
  }, [state.redirect]);

  const t = Object.fromEntries(
    (line?.translations ?? []).map((tr) => [tr.locale, tr])
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <input type="hidden" name="id" value={line?.id ?? ""} />
      {line && <input type="hidden" name="code" value={line.code} />}

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
              所属品牌 <span className="text-red-500">*</span>
            </label>
            <select
              name="brandId"
              defaultValue={line?.brandId ?? ""}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              <option value="">选择品牌</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.zhName} ({b.enName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              所属类别 <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              defaultValue={line?.categoryId ?? ""}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              <option value="">选择类别</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.zhName} ({c.enName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              系列代码 <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              defaultValue={line?.code ?? ""}
              required
              disabled={!!line}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-50"
              placeholder="如 SDS1000X"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">排序</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={line?.sortOrder ?? 0}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={line?.isActive ?? true}
                className="h-4 w-4 rounded border-slate-300"
              />
              启用（停用后前台不展示）
            </label>
          </div>
        </div>
      </section>

      {/* 多语言内容（TAB） */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">多语言内容</h2>
          <div className="flex rounded-md border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => switchLang("zh")}
              className={`rounded px-3 py-1 text-sm font-medium ${
                lang === "zh" ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => switchLang("en")}
              className={`rounded px-3 py-1 text-sm font-medium ${
                lang === "en" ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className={`space-y-4 ${lang === "zh" ? "" : "hidden"}`}>
          {mounted.zh && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  系列名称（中文）<span className="text-red-500">*</span>
                </label>
                <input
                  name="name_zh"
                  defaultValue={t["zh"]?.name ?? ""}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  placeholder="如 SDS1000X 系列"
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
            </>
          )}
        </div>

        <div className={`space-y-4 ${lang === "en" ? "" : "hidden"}`}>
          {mounted.en && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Series Name (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  name="name_en"
                  defaultValue={t["en"]?.name ?? ""}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  placeholder="e.g. SDS1000X Series"
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
            </>
          )}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存系列"}
        </button>
      </div>
    </form>
  );
}
