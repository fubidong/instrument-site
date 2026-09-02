"use client";

import { useState, useRef } from "react";

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
    side: "right" as "left" | "right",
  });
  const boxRef = useRef<HTMLDivElement>(null);
  // 电商式放大镜：镜头框 + 右侧/左侧放大面板
  const ZOOM = 2.5; // 放大倍数
  const PANEL = 320; // 放大面板尺寸(px)
  const LENS_PCT = 20; // 镜头框占主图比例(%)，与面板显示区域一致

  if (!all.length) {
    return (
      <div className={`flex ${height} w-full items-center justify-center rounded bg-slate-50 text-slate-300`}>
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
    // 鼠标靠近主图左半 → 放大镜放右侧；右半 → 放大镜放左侧（贴近鼠标，避免突兀/溢出）
    const side: "left" | "right" = x >= 50 ? "left" : "right";
    setZoom({ x, y, active: true, imgW: r.width, imgH: r.height, side });
  };

  return (
    <div ref={boxRef}>
      <div className="relative">
        {/* 主图：原样显示，不缩放 */}
        <div
          className="mx-auto aspect-square w-full max-w-[580px] overflow-hidden rounded-lg border border-slate-200 bg-white"
          onMouseMove={handleMove}
          onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.imagePath}
            alt={current.altText ?? alt}
            className="h-full w-full object-contain"
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

        {/* 放大面板：贴近鼠标一侧显示，与镜头框联动 */}
        <div
          className={`pointer-events-none absolute top-0 z-20 max-lg:hidden overflow-hidden rounded-lg border border-slate-100 bg-white shadow-xl ${
            zoom.side === "right" ? "left-full ml-4" : "right-full mr-4"
          }`}
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
              className={`h-14 w-14 shrink-0 overflow-hidden rounded p-0.5 ${
                selected === i ? "border-2 border-sky-500" : "border border-slate-200 hover:border-sky-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imagePath} alt={img.altText ?? alt} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
