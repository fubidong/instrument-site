"use client";

import { useActionState, useEffect, useState } from "react";
import { saveDocumentAction, type DocumentFormState } from "./actions";
import FileUpload from "@/components/admin/file-upload";

const initialState: DocumentFormState = {};

const DOC_TYPES = [
  { value: "datasheet", label: "数据手册 (Datasheet)" },
  { value: "user_manual", label: "用户手册 (User Manual)" },
  { value: "programming_manual", label: "编程手册 (Programming Manual)" },
  { value: "quick_guide", label: "快速指南 (Quick Guide)" },
  { value: "service_manual", label: "服务手册 (Service Manual)" },
  { value: "application_note", label: "应用笔记 (Application Note)" },
  { value: "other", label: "其他" },
];

const DOC_LANGS = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "other", label: "其他" },
];

export default function DocumentForm({
  doc,
  brands,
  productLines,
}: {
  doc: {
    id: string;
    title: string;
    docType: string;
    language: string;
    version: string | null;
    filePath: string;
    fileSize: number | null;
    brandId: string | null;
    productLineId: string | null;
    productId: string | null;
    isActive: boolean;
  } | null;
  brands: { id: string; zhName: string; enName: string }[];
  productLines: { id: string; label: string; brandId: string | null; categoryZh: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveDocumentAction, initialState);
  const [filePath, setFilePath] = useState(doc?.filePath ?? "");

  useEffect(() => {
    if (state.redirect) window.location.href = state.redirect;
  }, [state.redirect]);

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <input type="hidden" name="id" value={doc?.id ?? ""} />
      {doc && <input type="hidden" name="title" value={doc.title} />}

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
        <h2 className="mb-4 text-sm font-semibold text-slate-700">文件信息</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              defaultValue={doc?.title ?? ""}
              required
              disabled={!!doc}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-50"
              placeholder="如 SDS1000X 系列用户手册"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">文档类型</label>
            <select
              name="docType"
              defaultValue={doc?.docType ?? "datasheet"}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">语言</label>
            <select
              name="language"
              defaultValue={doc?.language ?? "zh"}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              {DOC_LANGS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">版本</label>
            <input
              name="version"
              defaultValue={doc?.version ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="如 V1.0"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">文件大小 (KB)</label>
            <input
              name="fileSize"
              type="number"
              defaultValue={doc?.fileSize ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              上传文件 <span className="text-red-500">*</span>
            </label>
            <FileUpload
              kind="doc"
              value={filePath}
              onChange={(url) => setFilePath(url)}
            />
            <input
              type="hidden"
              name="filePath"
              value={filePath}
            />
            <p className="mt-1 text-xs text-slate-400">
              支持 PDF / Word / Excel，单个文件 ≤ 50MB
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">关联信息（可选）</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">品牌</label>
            <select
              name="brandId"
              defaultValue={doc?.brandId ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              <option value="">不关联</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.zhName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">系列</label>
            <select
              name="productLineId"
              defaultValue={doc?.productLineId ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              <option value="">不关联</option>
              {productLines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={doc?.isActive ?? true}
                className="h-4 w-4 rounded border-slate-300"
              />
              启用
            </label>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存资料"}
        </button>
      </div>
    </form>
  );
}
