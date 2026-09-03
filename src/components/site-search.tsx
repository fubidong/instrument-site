"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchItem = {
  model: string;
  coverImage: string | null;
  brandCode: string;
  brandName: string;
  seriesName: string;
};

/**
 * 导航栏全局型号搜索框：输入即时下拉建议，点击跳转产品详情，回车进入产品列表搜索
 */
export default function SiteSearch({ locale, isEn }: { locale: string; isEn: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 防抖搜索
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const kw = q.trim();
    if (kw.length < 1) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(kw)}&locale=${locale}`);
        const data = await r.json();
        setItems(data.items ?? []);
        setOpen(true);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q, locale]);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const submit = (kw: string) => {
    setOpen(false);
    router.push(`/${locale}/products?q=${encodeURIComponent(kw.trim())}`);
  };

  const goModel = (model: string) => {
    setOpen(false);
    setQ("");
    router.push(`/${locale}/products/${encodeURIComponent(model)}`);
  };

  const placeholder = isEn ? "Search model..." : "搜索型号...";

  return (
    <div ref={wrapRef} className="relative w-44 lg:w-60">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim() && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim()) submit(q);
          }}
          placeholder={placeholder}
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setItems([]);
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="clear"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-400">
              {isEn ? "Searching..." : "搜索中..."}
            </div>
          ) : items.length === 0 ? (
            <button
              type="button"
              onClick={() => submit(q)}
              className="block w-full px-4 py-3 text-left text-sm text-slate-500 hover:bg-slate-50"
            >
              {isEn ? "No exact model. Search all products →" : "未找到精确型号，查看全部搜索结果 →"}
            </button>
          ) : (
            <>
              <div className="max-h-[60vh] overflow-y-auto py-1">
                {items.map((it) => (
                  <button
                    key={it.model}
                    type="button"
                    onClick={() => goModel(it.model)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-sky-50"
                  >
                    {it.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.coverImage} alt={it.model} className="h-9 w-9 shrink-0 rounded object-contain" />
                    ) : (
                      <div className="h-9 w-9 shrink-0 rounded bg-slate-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-sm font-semibold text-slate-800">{it.model}</div>
                      <div className="truncate text-xs text-slate-400">
                        {it.brandName} · {it.seriesName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => submit(q)}
                className="block w-full border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-sky-600 hover:bg-sky-50"
              >
                {isEn ? `View all results for "${q}"` : `查看 "${q}" 的全部结果`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
