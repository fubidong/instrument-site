"use client";

import { useState, useRef, useEffect } from "react";

interface NavBanner {
  imageUrl: string;
  href: string;
  alt_zh: string;
  alt_en: string;
  enabled: boolean;
}

interface MediaAsset {
  id: string;
  url: string;
  filename: string;
}

export function NavBannerEditor({
  banner: initialBanner,
  onSave,
}: {
  banner: NavBanner;
  onSave: (banner: NavBanner) => Promise<void>;
}) {
  const [banner, setBanner] = useState<NavBanner>(initialBanner);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const update = (field: keyof NavBanner, value: any) => {
    setBanner({ ...banner, [field]: value });
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        update("imageUrl", data.url);
      }
    } catch (e) {
      console.error(e);
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const openPicker = async () => {
    setPickerOpen(true);
    setLoadingMedia(true);
    try {
      const res = await fetch("/api/admin/media/list?kind=image&take=100");
      const data = await res.json();
      setMediaList(data.assets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMedia(false);
    }
  };

  const pickMedia = (url: string) => {
    update("imageUrl", url);
    setPickerOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(banner);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-slate-500">Banner 图片</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={banner.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
            placeholder="图片 URL 或从素材库选择"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={openPicker}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            素材库
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {uploading ? "上传中..." : "上传"}
          </button>
        </div>
        {banner.imageUrl && (
          <img
            src={banner.imageUrl}
            alt=""
            className="mt-2 h-20 w-auto rounded border border-slate-200 object-contain"
          />
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-500">链接</label>
        <input
          type="text"
          value={banner.href}
          onChange={(e) => update("href", e.target.value)}
          placeholder="/products 或 https://..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Alt 文字（中）</label>
          <input
            type="text"
            value={banner.alt_zh}
            onChange={(e) => update("alt_zh", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Alt 文字（英）</label>
          <input
            type="text"
            value={banner.alt_en}
            onChange={(e) => update("alt_en", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={banner.enabled}
          onChange={(e) => update("enabled", e.target.checked)}
          className="h-4 w-4"
        />
        <label className="text-sm text-slate-700">启用导航 Banner</label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存 Banner 配置"}
      </button>

      {/* 素材选择器模态框 */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPickerOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">选择素材</h3>
              <button onClick={() => setPickerOpen(false)} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            {loadingMedia ? (
              <div className="py-12 text-center text-sm text-slate-500">加载中...</div>
            ) : mediaList.length === 0 ? (
              <div className="space-y-4 py-12 text-center">
                <div className="text-sm text-slate-500">素材库暂无图片</div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    上传图片
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {mediaList.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pickMedia(m.url)}
                    className="group relative aspect-video overflow-hidden rounded border border-slate-200 hover:border-blue-500"
                  >
                    <img src={m.url} alt={m.filename} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
