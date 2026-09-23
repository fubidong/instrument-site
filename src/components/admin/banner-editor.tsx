"use client";

import { useState, useRef, useEffect } from "react";

interface Banner {
  imageUrl: string;
  link: string;
  alt: string;
}

interface MediaAsset {
  id: string;
  url: string;
  filename: string;
}

export function BannerEditor({
  banners: initialBanners,
  onSave,
}: {
  banners: Banner[];
  onSave: (banners: Banner[]) => Promise<void>;
}) {
  const [banners, setBanners] = useState<Banner[]>(
    initialBanners.length > 0 ? initialBanners : [{ imageUrl: "", link: "", alt: "" }]
  );
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const addBanner = () => {
    if (banners.length >= 6) return;
    setBanners([...banners, { imageUrl: "", link: "", alt: "" }]);
  };

  const removeBanner = (idx: number) => {
    setBanners(banners.filter((_, i) => i !== idx));
  };

  const updateBanner = (idx: number, field: keyof Banner, value: string) => {
    const next = [...banners];
    next[idx] = { ...next[idx], [field]: value };
    setBanners(next);
  };

  const uploadImage = async (idx: number, file: File) => {
    setUploading(idx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        updateBanner(idx, "imageUrl", data.url);
      }
    } catch (e) {
      console.error(e);
      alert("上传失败");
    } finally {
      setUploading(null);
    }
  };

  const openPicker = async (idx: number) => {
    setPickerIdx(idx);
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
    if (pickerIdx !== null) {
      updateBanner(pickerIdx, "imageUrl", url);
    }
    setPickerIdx(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(banners.filter((b) => b.imageUrl));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {banners.map((banner, i) => (
        <div key={i} className="rounded-md border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Banner {i + 1}</h3>
            {banners.length > 1 && (
              <button
                type="button"
                onClick={() => removeBanner(i)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                删除
              </button>
            )}
          </div>
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">图片</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={banner.imageUrl}
                  onChange={(e) => updateBanner(i, "imageUrl", e.target.value)}
                  placeholder="图片 URL 或从素材库选择"
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => openPicker(i)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  素材库
                </button>
                <input
                  ref={(el) => { fileRefs.current[i] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(i, f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRefs.current[i]?.click()}
                  disabled={uploading === i}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {uploading === i ? "上传中..." : "上传"}
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
                value={banner.link}
                onChange={(e) => updateBanner(i, "link", e.target.value)}
                placeholder="/products 或 https://..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Alt 文字</label>
              <input
                type="text"
                value={banner.alt}
                onChange={(e) => updateBanner(i, "alt", e.target.value)}
                placeholder="图片替代文字"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      ))}

      {banners.length < 6 && (
        <button
          type="button"
          onClick={addBanner}
          className="rounded-md border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          + 新增 Banner（最多 6 个）
        </button>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存 Banner 轮播"}
      </button>

      {/* 素材选择器模态框 */}
      {pickerIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPickerIdx(null)}>
          <div className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">选择素材</h3>
              <button onClick={() => setPickerIdx(null)} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            {loadingMedia ? (
              <div className="py-12 text-center text-sm text-slate-500">加载中...</div>
            ) : mediaList.length === 0 ? (
              <div className="space-y-4 py-12 text-center">
                <div className="text-sm text-slate-500">素材库暂无图片</div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRefs.current[pickerIdx]?.click()}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    上传图片
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerIdx(null)}
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
