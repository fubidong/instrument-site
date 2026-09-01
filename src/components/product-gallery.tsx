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
 * 产品图库：主图 + 缩略图切换
 * - 第一项为 coverImage（主图），其后为 ProductImage 附加图
 * - 点击缩略图切换主图显示
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

  if (!all.length) {
    return (
      <div className={`flex ${height} w-full items-center justify-center rounded bg-slate-50 text-slate-300`}>
        {noImageText}
      </div>
    );
  }
  const current = all[Math.min(selected, all.length - 1)];

  return (
    <div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.imagePath} alt={current.altText ?? alt} className={`mx-auto ${height} w-full object-contain`} />
      </div>
      {all.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
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
