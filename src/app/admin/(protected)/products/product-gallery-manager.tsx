"use client";

import { useRef, useState, useTransition } from "react";
import {
  addProductImageAction,
  deleteProductImageAction,
  moveProductImageAction,
  setCoverImageAction,
} from "./actions";

type GalleryImage = {
  id: string;
  imagePath: string;
  sortOrder: number;
};

/**
 * 产品图库管理：展示/新增/删除/排序/设封面
 */
export default function ProductGalleryManager({
  productId,
  coverImage,
  images,
}: {
  productId: string;
  coverImage: string | null;
  images: GalleryImage[];
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function notify(r: any) {
    if (r?.error) setMsg(r.error);
    else if (r?.success) setMsg(r.success);
    setTimeout(() => setMsg(null), 2500);
  }

  function doAdd(imagePath: string) {
    if (!imagePath) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("productId", productId);
      fd.append("imagePath", imagePath);
      const r = await addProductImageAction(fd);
      notify(r);
    });
  }

  function doDelete(id: string) {
    if (!confirm("确定从图库移除该图片？（仅移除记录，文件保留）")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      const r = await deleteProductImageAction(fd);
      notify(r);
    });
  }

  function doMove(id: string, direction: "up" | "down") {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      fd.append("direction", direction);
      const r = await moveProductImageAction(fd);
      notify(r);
    });
  }

  function doSetCover(imagePath: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("productId", productId);
      fd.append("imagePath", imagePath);
      const r = await setCoverImageAction(fd);
      notify(r);
    });
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "image");
      body.append("category", "product");
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      doAdd(data.url);
    } catch (e: any) {
      setMsg(e.message || "上传失败");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">产品图库</h2>
        <span className="text-xs text-slate-400">
          共 {images.length} 张 · 前台详情页轮播显示（第 1 张为主图）
        </span>
      </div>

      {msg && (
        <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {msg}
        </div>
      )}

      {images.length === 0 ? (
        <p className="mb-3 rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
          暂无图库图片，上传或粘贴图片路径后添加
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="group relative rounded-lg border border-slate-200 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.imagePath}
                alt={`图${i + 1}`}
                className="h-24 w-full rounded-md border border-slate-100 object-contain"
              />
              <div className="mt-1 flex items-center justify-between px-0.5">
                <span className="text-xs text-slate-400">#{i + 1}</span>
                {coverImage === img.imagePath ? (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                    主图
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => doSetCover(img.imagePath)}
                    className="text-[11px] text-sky-600 hover:underline"
                  >
                    设为主图
                  </button>
                )}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => doMove(img.id, "up")}
                    disabled={i === 0 || pending}
                    className="rounded px-1 hover:bg-slate-100 disabled:opacity-30"
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => doMove(img.id, "down")}
                    disabled={i === images.length - 1 || pending}
                    className="rounded px-1 hover:bg-slate-100 disabled:opacity-30"
                    title="下移"
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => doDelete(img.id)}
                  disabled={pending}
                  className="text-red-500 hover:underline disabled:opacity-40"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增图片 */}
      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || pending}
            className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {uploading ? "上传中..." : "上传图片"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="或粘贴图片路径 /uploads/xxx.jpg"
              className="w-full min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={() => {
                doAdd(urlInput.trim());
                setUrlInput("");
              }}
              disabled={!urlInput.trim() || pending}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              添加
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          上传的图片会同时进入素材库。上传后如未显示，请刷新页面。
        </p>
      </div>
    </section>
  );
}
