"use client";

import { useEffect, useState, useTransition } from "react";
import Modal from "./modal";
import { searchMediaImagesAction } from "@/app/admin/(protected)/media/actions";

type MediaItem = { id: string; path: string; filename: string };

/**
 * 素材库图片选择器（通用）：弹窗展示素材库图片，支持关键词搜索，选中后回调
 */
export default function MediaPicker({
  open,
  onClose,
  onSelect,
  selectedPaths = [],
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  selectedPaths?: string[];
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const r = await searchMediaImagesAction(query);
      setItems(r.items);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  return (
    <Modal open={open} onClose={onClose} title="从素材库选择图片" width="max-w-4xl">
      <div className="mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索素材文件名..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
      </div>
      {pending ? (
        <p className="py-8 text-center text-sm text-slate-400">加载中...</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">素材库暂无图片，请先到素材库上传</p>
      ) : (
        <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
          {items.map((it) => {
            const selected = selectedPaths.includes(it.path);
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onSelect(it.path)}
                className={`group rounded-lg border p-2 text-left transition-colors ${
                  selected
                    ? "border-sky-500 bg-sky-50"
                    : "border-slate-200 hover:border-sky-300"
                }`}
                title={it.filename}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.path}
                  alt={it.filename}
                  className="h-20 w-full rounded-md border border-slate-100 object-contain"
                  loading="lazy"
                />
                <p className="mt-1 truncate text-[11px] text-slate-500">{it.filename}</p>
                {selected && (
                  <p className="text-[11px] font-medium text-sky-600">已添加</p>
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          关闭
        </button>
      </div>
    </Modal>
  );
}
