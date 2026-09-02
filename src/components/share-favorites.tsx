"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cxy_favorites";

/** 收藏 + 分享 图标按钮组（收藏存 localStorage，分享复制当前链接） */
export default function ShareFavorites({
  model,
  isEn = false,
}: {
  model: string;
  isEn?: boolean;
}) {
  const [fav, setFav] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setFav(Array.isArray(raw) && raw.includes(model));
    } catch {
      /* ignore */
    }
  }, [model]);

  function toggleFav() {
    setFav((prev) => {
      const next = !prev;
      try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const list = Array.isArray(raw) ? raw : [];
        const updated = next ? [...list, model] : list.filter((m) => m !== model);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  const btn =
    "inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 transition hover:border-sky-400 hover:text-sky-600";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleFav}
        title={isEn ? (fav ? "Remove from favorites" : "Add to favorites") : fav ? "取消收藏" : "收藏"}
        className={`${btn} ${fav ? "border-rose-300 text-rose-500" : ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill={fav ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={share}
        title={isEn ? "Share" : "分享"}
        className={btn}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
