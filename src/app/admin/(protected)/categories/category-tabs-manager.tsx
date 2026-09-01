"use client";

import { useActionState, useState } from "react";
import { saveProductTabAction, deleteProductTabAction, type TabFormState } from "./tabs-actions";

type TabItem = {
  id: string;
  code: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  translations: { locale: string; title: string; content: string | null }[];
};

const initialState: TabFormState = {};

export default function CategoryTabsManager({
  categoryId,
  tabs,
}: {
  categoryId: string;
  tabs: TabItem[];
}) {
  const [state, formAction, pending] = useActionState(saveProductTabAction, initialState);
  const [editing, setEditing] = useState<TabItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const t = (tab: TabItem, locale: string) =>
    tab.translations.find((tr) => tr.locale === locale);

  const close = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">详情页自定义选项卡</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            不同品类显示不同选项卡（如示波器加"探头配件"、电源加"效率曲线"）
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500"
        >
          + 新增选项卡
        </button>
      </div>

      {state.success && (
        <div className="mb-3 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
          {state.success}
        </div>
      )}

      {tabs.length === 0 ? (
        <div className="rounded-md bg-slate-50 p-6 text-center text-sm text-slate-400">
          该品类暂无自定义选项卡
        </div>
      ) : (
        <div className="space-y-2">
          {tabs
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((tab) => (
              <div
                key={tab.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tab.icon ?? "📄"}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {t(tab, "zh")?.title}
                      <span className="ml-2 text-xs text-slate-400">{tab.code}</span>
                      {!tab.isActive && (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                          隐藏
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      EN: {t(tab, "en")?.title}
                      {(t(tab, "zh")?.content?.length ?? 0) > 0 && (
                        <span className="ml-2">内容 {(t(tab, "zh")?.content?.length ?? 0)} 字</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(tab);
                      setShowForm(true);
                    }}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    编辑
                  </button>
                  <form action={deleteProductTabAction}>
                    <input type="hidden" name="id" value={tab.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      删除
                    </button>
                  </form>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editing ? "编辑选项卡" : "新增选项卡"}
              </h3>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {state.error && (
              <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="id" value={editing?.id ?? ""} />
              <input type="hidden" name="categoryId" value={categoryId} />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">标识 code *</label>
                  <input
                    name="code"
                    defaultValue={editing?.code ?? ""}
                    required
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                    placeholder="accessory"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">图标</label>
                  <input
                    name="icon"
                    defaultValue={editing?.icon ?? ""}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                    placeholder="📄"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">排序</label>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={editing?.sortOrder ?? 0}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                  />
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editing?.isActive ?? true}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    启用
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">标题（中文）*</label>
                  <input
                    name="title_zh"
                    defaultValue={t(editing!, "zh")?.title ?? ""}
                    required
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                    placeholder="探头配件"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">标题（英文）*</label>
                  <input
                    name="title_en"
                    defaultValue={t(editing!, "en")?.title ?? ""}
                    required
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                    placeholder="Probes & Accessories"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  内容（中文，支持 HTML）
                </label>
                <textarea
                  name="content_zh"
                  rows={5}
                  defaultValue={t(editing!, "zh")?.content ?? ""}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  内容（英文，支持 HTML）
                </label>
                <textarea
                  name="content_en"
                  rows={5}
                  defaultValue={t(editing!, "en")?.content ?? ""}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                >
                  {pending ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
