"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Banner = { imageUrl: string; link?: string; alt?: string };

export default function HeroBanner({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length, paused]);

  if (!banners || banners.length === 0) return null;

  const current = banners[index];

  return (
    <div
      className="relative h-[420px] w-full overflow-hidden sm:h-[500px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 图片 */}
      {banners.map((b, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={b.imageUrl}
          alt={b.alt || ""}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-transparent" />
      {/* 指示器 */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-8 bg-white" : "w-4 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
