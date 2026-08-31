"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "compare_products";

function readCompare(): { id: string; model: string }[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function CompareBar({ productId, productModel }: { productId: string; productModel: string }) {
  const [inCompare, setInCompare] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const list = readCompare();
    setInCompare(list.some((p) => p.id === productId));
    setCount(list.length);
  }, [productId]);

  function toggle() {
    let list = readCompare();
    if (list.some((p) => p.id === productId)) {
      list = list.filter((p) => p.id !== productId);
    } else {
      if (list.length >= 5) {
        alert("最多对比 5 个产品");
        return;
      }
      list.push({ id: productId, model: productModel });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setInCompare(list.some((p) => p.id === productId));
    setCount(list.length);
  }

  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
          inCompare
            ? "border-sky-500 bg-sky-50 text-sky-700"
            : "border-slate-300 text-slate-600 hover:border-sky-400"
        }`}
      >
        {inCompare ? "已加入对比 ✓" : "加入对比"}
      </button>
      {count > 0 && (
        <Link
          href="/compare"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          去对比 ({count})
        </Link>
      )}
    </div>
  );
}
