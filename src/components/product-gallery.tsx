"use client";

import { useState, useRef } from "react";
import Image from "next/image";

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
 * 产品图库（电商风格独立放大镜）：
 * - 主图保持原样（object-contain，不裁剪不变形）
 * - 鼠标悬停主图 → 主图右侧显示独立放大区域（局部放大 2.5 倍，平滑跟随）
 * - 淡入上浮 / 淡出下沉动画；移动端自动隐藏
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
  const [zoom, setZoom] = useState({
    x: 50,
    y: 50,
    active: false,
    imgW: 1,
    imgH: 1,
  });
  const boxRef = useRef<HTMLDivElement>(null);
  // 电商式放大镜：镜头框 + 右侧放大面板
  const ZOOM = 2.5; // 放大倍数
  const PANEL = 320; // 放大面板尺寸(px)
  const LENS_PCT = 20; // 镜头框占主图比例(%)，与面板显示区域一致

  if (!all.length) {
    return (
      <div className={`flex ${height} w-full items-center justify-center rounded-xl border border-slate-200 bg-[var(--ui-sunken)] text-slate-300`}>
        {noImageText}
      </div>
    );
  }
  const current = all[Math.min(selected, all.length - 1)];

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const img = e.currentTarget.querySelector("img");
    if (!img) return;
    const r = img.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    setZoom({ x, y, active: true, imgW: r.width, imgH: r.height });
  };

  return (
    <div ref={boxRef}>
      <div className="relative">
        {/* 主图：原样显示，不缩放 */}
        <div
          className="relative mx-auto aspect-square w-full max-w-[580px] overflow-hidden rounded-xl border border-slate-200 bg-white"
          onMouseMove={handleMove}
          onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
        >
          <Image
            src={current.imagePath}
            alt={current.altText ?? alt}
            fill
            sizes="(max-width: 768px) 100vw, 580px"
            className="object-contain"
            unoptimized
          />

          {/* 镜头框：主图内跟随鼠标，标记放大区域 */}
          {zoom.active && (
            <div
              className="pointer-events-none absolute z-10 rounded border-2 border-white/90 shadow-md"
              style={{
                width: `${LENS_PCT}%`,
                height: `${LENS_PCT}%`,
                left: `calc(${zoom.x}% - ${LENS_PCT / 2}%)`,
                top: `calc(${zoom.y}% - ${LENS_PCT / 2}%)`,
                backgroundImage: `url(${current.imagePath})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${zoom.imgW * ZOOM}px ${zoom.imgH * ZOOM}px`,
                backgroundPosition: `${zoom.x}% ${zoom.y}%`,
              }}
            />
          )}
        </div>

        {/* 放大面板：固定显示在主图右侧，与镜头框联动 */}
        <div
          className={`pointer-events-none absolute top-0 z-20 max-lg:hidden overflow-hidden rounded-lg border border-slate-100 bg-white shadow-xl left-full ml-4`}
          style={{
            width: PANEL,
            height: PANEL,
            opacity: zoom.active ? 1 : 0,
            transform: zoom.active
              ? "translateY(0) scale(1)"
              : "translateY(6px) scale(0.96)",
          }}
        >
          {zoom.active && (
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `url(${current.imagePath})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${zoom.imgW * ZOOM}px ${zoom.imgH * ZOOM}px`,
                backgroundPosition: `${zoom.x}% ${zoom.y}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* 缩略图：横向一排（可左右滚动） */}
      {all.length > 1 && (
        <div className="mx-auto mt-3 flex max-w-[580px] gap-2 overflow-x-auto pb-1">
          {all.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => {
                setSelected(i);
                setZoom((z) => ({ ...z, x: 50, y: 50, active: false }));
              }}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-md p-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                selected === i ? "border-2 border-primary" : "border border-slate-200 hover:border-slate-300"
              }`}
            >
              <Image
                src={img.imagePath}
                alt={img.altText ?? alt}
                width={56}
                height={56}
                className="h-full w-full object-contain"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
