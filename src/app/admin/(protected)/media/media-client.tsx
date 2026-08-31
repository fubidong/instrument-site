"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteAssetAction, batchDeleteAssetsAction } from "./actions";

type Asset = {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  kind: string;
  size: number | null;
  category: string;
  createdAt: Date;
};

const CATEGORY_LABEL: Record<string, string> = {
  product: "产品图片",
  brand: "品牌 Logo",
  doc: "资料文档",
  news: "新闻配图",
  other: "其他",
};

export default function MediaClient({
  assets,
  total,
  kindCounts,
  currentKind,
  currentCategory,
  currentQ,
  categories,
  kinds,
}: {
  assets: Asset[];
  total: number;
  kindCounts: { image: number; doc: number };
  currentKind: string;
  currentCategory: string;
  currentQ: string;
  categories: { value: string; label: string }[];
  kinds: { value: string; label: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/admin/media?${params.toString()}`);
  }

  async function handleUploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (const file of Array.from(files)) {
        const kind = file.type.startsWith("image/") ? "image" : "doc";
        const category = kind === "image" ? "product" : "doc";
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", kind);
        fd.append("category", category);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "上传失败");
        }
      }
      router.refresh();
    } catch (e: any) {
      setUploadError(e.message || "上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDelete(id: string) {
    if (!confirm("确定删除该素材？")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      await deleteAssetAction(fd);
      router.refresh();
    });
  }

  function handleBatchDelete() {
    if (selected.length === 0) return;
    if (!confirm(`确定删除选中的 ${selected.length} 个素材？`)) return;
    startTransition(async () => {
      const fd = new FormData();
      selected.forEach((id) => fd.append("ids", id));
      const r = (await batchDeleteAssetsAction(fd)) as { error?: string };
      if (r?.error) alert(r.error);
      setSelected([]);
      router.refresh();
    });
  }

  function copyUrl(path: string) {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(path);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const isAllSelected = assets.length > 0 && selected.length === assets.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">素材库</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {total} 个素材（图片 {kindCounts.image} / 文档 {kindCounts.doc}）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUploadFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {uploading ? "上传中..." : "+ 上传素材"}
          </button>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={handleBatchDelete}
              disabled={pending}
              className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              删除选中 ({selected.length})
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {uploadError}
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <select
          value={currentKind}
          onChange={(e) => updateFilter("kind", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        >
          {kinds.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <select
          value={currentCategory}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          value={currentQ}
          onChange={(e) => updateFilter("q", e.target.value)}
          placeholder="搜索文件名..."
          className="w-52 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        />
        <button
          type="button"
          onClick={() => {
            router.push("/admin/media");
            setSelected([]);
          }}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          清除筛选
        </button>
      </div>

      {/* 素材网格 */}
      {assets.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          暂无素材，点击右上角上传
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.map((a) => (
            <div
              key={a.id}
              className={`group relative overflow-hidden rounded-lg border bg-white ${
                selected.includes(a.id) ? "border-sky-500 ring-2 ring-sky-200" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setSelected((s) =>
                    s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id]
                  )
                }
                className="absolute left-2 top-2 z-10 h-4 w-4 rounded border border-white/70 bg-white/80 text-sky-600"
              >
                {selected.includes(a.id) ? "✓" : ""}
              </button>

              <div className="flex h-36 items-center justify-center bg-slate-50">
                {a.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.path} alt={a.filename} className="h-full w-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="px-2 text-xs">{a.filename.split(".").pop()?.toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 border-t border-slate-100 p-2">
                <div className="truncate text-xs font-medium text-slate-700" title={a.filename}>
                  {a.filename}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{CATEGORY_LABEL[a.category] ?? a.category}</span>
                  <span>
                    {a.kind === "image" ? "图片" : "文档"}
                    {a.size ? ` · ${(a.size / 1024).toFixed(0)}KB` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyUrl(a.path)}
                    className="flex-1 rounded border border-slate-200 py-0.5 text-[10px] text-slate-500 hover:bg-slate-50"
                  >
                    {copied === a.path ? "已复制 ✓" : "复制链接"}
                  </button>
                  <a
                    href={a.path}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-50"
                  >
                    查看
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    disabled={pending}
                    className="rounded border border-red-200 px-1.5 py-0.5 text-[10px] text-red-500 hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 全选工具条 */}
      {assets.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() =>
                setSelected(isAllSelected ? [] : assets.map((a) => a.id))
              }
              className="h-4 w-4"
            />
            全选本页
          </label>
          <span>
            已选 {selected.length} 个
            {selected.length > 0 && (
              <button
                type="button"
                onClick={handleBatchDelete}
                disabled={pending}
                className="ml-2 text-red-500 hover:underline"
              >
                批量删除
              </button>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
