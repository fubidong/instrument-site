"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/modal";
import { addProductSpecAction, removeProductSpecAction } from "./actions";
import { searchMediaDocsAction } from "../media/actions";

export type SpecDoc = { id: string; title: string; filePath: string };

type MediaDoc = { id: string; path: string; filename: string; mimeType: string };

/**
 * 产品规格书管理：为该产品指定显示在"产品规格"选项卡的 PDF 规格书。
 * - 可批量添加系列内已有的规格手册（datasheet）
 * - 可手动添加（标题 + PDF 路径，路径可从素材库复制）
 */
export default function ProductSpecManager({
  productId,
  specs,
  candidates,
}: {
  productId: string;
  specs: SpecDoc[];
  candidates: SpecDoc[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [manualTitle, setManualTitle] = useState("");
  const [manualPath, setManualPath] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [docs, setDocs] = useState<MediaDoc[]>([]);
  const [docQuery, setDocQuery] = useState("");
  const [docLoading, setDocLoading] = useState(false);

  function toggleSelect(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function run(action: (fd: FormData) => Promise<any>, fields: [string, string][], okMsg: string) {
    const fd = new FormData();
    fields.forEach(([k, v]) => fd.append(k, v));
    startTransition(async () => {
      const r = await action(fd);
      setMsg(r?.error ? `操作失败：${r.error}` : okMsg);
      setTimeout(() => setMsg(null), 2500);
    });
  }

  async function openPicker() {
    setPickerOpen(true);
    setDocLoading(true);
    try {
      const r = await searchMediaDocsAction("");
      setDocs(r.items);
    } finally {
      setDocLoading(false);
    }
  }

  async function searchDocs() {
    setDocLoading(true);
    try {
      const r = await searchMediaDocsAction(docQuery);
      setDocs(r.items);
    } finally {
      setDocLoading(false);
    }
  }

  function pickDoc(d: MediaDoc) {
    setManualPath(d.path);
    if (!manualTitle) setManualTitle(d.filename.replace(/\.pdf$/i, ""));
    setPickerOpen(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        前台"产品规格"选项卡按此列表顺序展示规格书 PDF；不在此列表时回退显示系列规格手册。
      </p>

      {msg && (
        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
          {msg}
        </div>
      )}

      {/* 已选规格书 */}
      {specs.length > 0 ? (
        <div className="space-y-2">
          {specs.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 shrink-0 text-rose-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span className="truncate text-sm text-slate-700">{s.title}</span>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(removeProductSpecAction, [["id", s.id]], "已移除")}
                className="shrink-0 rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                移除
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
          尚未指定规格书，将自动回退显示系列规格手册
        </div>
      )}

      {/* 从系列规格手册添加 */}
      {candidates.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
          <div className="mb-2 text-xs font-medium text-slate-500">
            从系列规格手册添加（可多选）
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {candidates.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-slate-600 hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                <span className="truncate">{c.title}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={pending || selected.length === 0}
            onClick={() => {
              const fd = new FormData();
              fd.append("productId", productId);
              selected.forEach((id) => fd.append("docId", id));
              startTransition(async () => {
                const r = await addProductSpecAction(fd);
                setMsg(r?.error ? `添加失败：${r.error}` : `已添加 ${selected.length} 个规格书`);
                if (!r?.error) setSelected([]);
                setTimeout(() => setMsg(null), 2500);
              });
            }}
            className="mt-2 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {pending ? "处理中..." : "添加所选"}
          </button>
        </div>
      )}

      {/* 手动添加 */}
      <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-medium text-slate-500">
            手动添加规格书（PDF 路径可从素材库选择）
          </div>
          <button
            type="button"
            onClick={openPicker}
            className="rounded border border-sky-300 px-2 py-1 text-xs text-sky-600 hover:bg-sky-50"
          >
            从素材库选择文档
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="规格书标题（如 SDS1000X-HD 数据手册）"
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
          />
          <input
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            placeholder="/uploads/docs/2026/xxx.pdf"
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
          />
        </div>
        <button
          type="button"
          disabled={pending || !manualTitle.trim() || !manualPath.trim()}
          onClick={() => {
            const fd = new FormData();
            fd.append("productId", productId);
            fd.append("title", manualTitle.trim());
            fd.append("filePath", manualPath.trim());
            startTransition(async () => {
              const r = await addProductSpecAction(fd);
              setMsg(r?.error ? `添加失败：${r.error}` : "已添加规格书");
              if (!r?.error) {
                setManualTitle("");
                setManualPath("");
              }
              setTimeout(() => setMsg(null), 2500);
            });
          }}
          className="mt-2 rounded-md border border-sky-600 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-50 disabled:opacity-50"
        >
          {pending ? "处理中..." : "手动添加"}
        </button>
      </div>

      {/* 从素材库选择文档弹窗 */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="从素材库选择文档" width="max-w-3xl">
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={docQuery}
            onChange={(e) => setDocQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchDocs()}
            placeholder="搜索素材文件名..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={searchDocs}
            className="shrink-0 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            搜索
          </button>
        </div>
        {docLoading ? (
          <p className="py-8 text-center text-sm text-slate-400">加载中...</p>
        ) : docs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            素材库暂无文档，请先到素材库上传 PDF
          </p>
        ) : (
          <div className="max-h-[55vh] space-y-2 overflow-y-auto">
            {docs.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => pickDoc(d)}
                className="flex w-full items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50/40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 shrink-0 text-rose-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{d.filename}</span>
                <span className="shrink-0 text-xs text-slate-400">{d.path}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setPickerOpen(false)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>
      </Modal>
    </div>
  );
}
