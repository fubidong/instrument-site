"use client";

import { useState } from "react";

interface GalleryImage {
  id: string;
  imagePath: string;
  altText?: string | null;
}

interface Props {
  coverImage?: string | null;
  images?: GalleryImage[];
  alt?: string;
  height?: string;
  noImageText?: string;
}

/**
 * 产品图库（电商风格）：
 * - 主图为正方形适中尺寸（参考 store.siglent.com），白底、图片自然等比显示
 * - 鼠标悬停主图 → 跟随鼠标局部放大（放大镜效果）
 * - 缩略图点击切换主图
 */
export default function ProductGallery({
  coverImage,
  images = [],
  alt = "",
  height = "h-72",
  noImageText = "暂无图片",
}: Props) {
  const all = [
    ...(coverImage ? [{ id: "cover", imagePath: coverImage, altText: alt }] : []),
    ...images.map((i) => ({ id: i.id, imagePath: i.imagePath, altText: i.altText ?? alt })),
  ];
  const [selected, setSelected] = useState(0);
  // 放大镜状态（鼠标位置百分比 + 是否激活）
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false });

  if (!all.length) {
    return (
      <div className={`flex ${height} w-full items-center justify-center rounded bg-slate-50 text-slate-300`}>
        {noImageText}
      </div>
    );
  }
  const current = all[Math.min(selected, all.length - 1)];

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setZoom({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)), active: true });
  };

  return (
    <div>
      {/* 主图：正方形 + 悬停放大镜 */}
      <div
        className="relative mx-auto aspect-square w-full max-w-[400px] cursor-zoom-in overflow-hidden rounded-lg border border-slate-200 bg-white"
        onMouseMove={handleMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.imagePath}
          alt={current.altText ?? alt}
          className="h-full w-full object-contain transition-transform duration-150 ease-out"
          style={{
            transform: zoom.active ? `scale(2.2) translate(${(50 - zoom.x) * 5}%, ${(50 - zoom.y) * 5}%)` : "scale(1)",
            transformOrigin: `${zoom.x}% ${zoom.y}%`,
          }}
        />
        {/* 放大镜提示角标 */}
        <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-400">
          {alt}
        </span>
      </div>

      {/* 缩略图 */}
      {all.length > 1 && (
        <div className="mx-auto mt-3 grid max-w-[400px] grid-cols-5 gap-2">
          {all.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelected(i)}
              className={`overflow-hidden rounded p-0.5 ${
                selected === i ? "border-2 border-sky-500" : "border border-slate-200 hover:border-sky-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imagePath} alt={img.altText ?? alt} className="h-14 w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
