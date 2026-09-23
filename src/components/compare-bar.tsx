"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "compare_products";
const EVENT_KEY = "compare-changed";

function readCompare(): { id: string; model: string }[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCompare(list: { id: string; model: string }[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  // 同标签页内通知其它组件（CompareBar）同步
  window.dispatchEvent(new Event(EVENT_KEY));
}

/**
 * 内联「加入对比」按钮（用于详情页操作按钮组）
 */
export function CompareToggle({
  locale,
  productId,
  productModel,
  className,
}: {
  locale: string;
  productId: string;
  productModel: string;
  className?: string;
}) {
  const isEn = locale === "en";
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    setInCompare(readCompare().some((p) => p.id === productId));
  }, [productId]);

  function toggle() {
    let list = readCompare();
    if (list.some((p) => p.id === productId)) {
      list = list.filter((p) => p.id !== productId);
    } else {
      if (list.length >= 5) {
        alert(isEn ? "Compare up to 5 products" : "最多对比 5 个产品");
        return;
      }
      list.push({ id: productId, model: productModel });
    }
    writeCompare(list);
    setInCompare(list.some((p) => p.id === productId));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        className ??
        `rounded-md border px-5 py-2.5 text-sm font-semibold transition ${
          inCompare
            ? "border-primary bg-slate-50 text-primary"
            : "border-slate-300 text-slate-600 hover:border-primary hover:text-primary"
        }`
      }
    >
      {inCompare ? (isEn ? "In Compare ✓" : "已加入对比 ✓") : isEn ? "Compare" : "加入对比"}
    </button>
  );
}

/**
 * 底部悬浮对比栏：已选产品时固定显示，随时可去对比 / 清空
 */
export default function CompareBar({ locale }: { locale: string }) {
  const isEn = locale === "en";
  const [list, setList] = useState<{ id: string; model: string }[]>([]);
  const [compareHref, setCompareHref] = useState("");

  useEffect(() => {
    const sync = () => {
      const l = readCompare();
      setList(l);
      setCompareHref(l.length > 0 ? `/compare?ids=${l.map((p) => p.id).join(",")}` : "/compare");
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(EVENT_KEY, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT_KEY, sync);
    };
  }, []);

  if (list.length === 0) return null;

  function clear() {
    localStorage.setItem(STORAGE_KEY, "[]");
    setList([]);
    setCompareHref("");
    window.dispatchEvent(new Event(EVENT_KEY));
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <span className="shrink-0 text-sm font-medium text-slate-700">
          {isEn ? "Selected" : "已选产品"}
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-2 overflow-hidden">
          {list.map((p) => (
            <span
              key={p.id}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-600"
            >
              {p.model}
            </span>
          ))}
        </div>
        <Link
          href={compareHref}
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {isEn ? `Compare (${list.length})` : `去对比 (${list.length})`}
        </Link>
        <button
          type="button"
          onClick={clear}
          className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700"
        >
          {isEn ? "Clear" : "清空"}
        </button>
      </div>
    </div>
  );
}
