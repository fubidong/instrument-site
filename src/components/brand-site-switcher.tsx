"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Globe } from "lucide-react";

export type BrandSiteItem = {
  code: string;
  name: string;
  href: string;
  logo?: string | null;
};

/** 品牌站导航栏右侧"品牌站点"下拉切换器（h-9，与搜索框基线对齐） */
export default function BrandSiteSwitcher({
  brands,
  isEn,
  currentBrand,
}: {
  brands: BrandSiteItem[];
  isEn: boolean;
  currentBrand: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {isEn ? "Brand Sites" : "品牌站点"}
        <ChevronDown
          width={14}
          height={14}
          aria-hidden="true"
          className={`text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          {/* 综合站（主站）入口 */}
          <Link
            href={isEn ? "/en" : "/"}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary"
          >
            <Globe width={18} height={18} className="shrink-0 text-primary" aria-hidden="true" />
            {isEn ? "Main Site" : "综合站"}
          </Link>

          <div className="my-1 border-t border-slate-100" />

          {brands.map((b) => {
            const active = b.code.toLowerCase() === currentBrand.toLowerCase();
            return (
              <Link
                key={b.code}
                href={b.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50 hover:text-primary ${
                  active ? "font-medium text-primary" : "text-slate-600"
                }`}
              >
                {b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo} alt={b.name} className="h-6 w-6 shrink-0 rounded object-contain" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-bold text-primary">
                    {b.name.slice(0, 1)}
                  </span>
                )}
                <span className="truncate">{b.name}</span>
                {active && (
                  <span className="ml-auto text-xs text-primary">{isEn ? "current" : "当前"}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
