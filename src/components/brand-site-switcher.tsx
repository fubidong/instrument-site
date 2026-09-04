"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export type BrandSiteItem = {
  code: string;
  name: string;
  href: string;
  logo?: string | null;
};

/** 品牌站导航栏右侧"品牌站点"下拉切换器 */
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
        className="flex items-center gap-1 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {isEn ? "Brand Sites" : "品牌站点"}
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          {brands.map((b) => {
            const active = b.code.toLowerCase() === currentBrand.toLowerCase();
            return (
              <Link
                key={b.code}
                href={b.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${
                  active ? "font-semibold text-sky-600" : "text-slate-700"
                }`}
              >
                {b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo} alt={b.name} className="h-6 w-6 rounded object-contain" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-sky-100 text-xs font-bold text-sky-600">
                    {b.name.slice(0, 1)}
                  </span>
                )}
                <span className="truncate">{b.name}</span>
                {active && <span className="ml-auto text-xs text-sky-500">{isEn ? "current" : "当前"}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
