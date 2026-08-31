"use client";

import { useRef, useState } from "react";

/**
 * 单文件上传组件
 * - kind: image | doc
 * - value: 已上传文件的公开路径
 * - onChange: 上传成功后回调路径
 */
export default function FileUpload({
  kind = "image",
  value,
  onChange,
  accept,
}: {
  kind?: "image" | "doc";
  value?: string | null;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "上传失败");
      }
      onChange(data.url);
    } catch (e: any) {
      setError(e.message || "上传失败");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isImage = kind === "image";
  const acceptAttr = accept ?? (isImage ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx,.zip");

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="hidden"
      />
      {value ? (
        <div className="flex items-center gap-3">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="preview"
              className="h-16 w-24 rounded border border-slate-200 object-contain bg-white"
            />
          ) : (
            <div className="flex h-16 w-24 items-center justify-center rounded border border-slate-200 bg-white text-xs text-slate-400">
              {value.split("/").pop()}
            </div>
          )}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading ? "上传中..." : "更换"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="block rounded border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
            >
              移除
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-sky-400 hover:text-sky-600 disabled:opacity-50"
        >
          {uploading ? "上传中..." : isImage ? "上传图片" : "上传文件"}
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
