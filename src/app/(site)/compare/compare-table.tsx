"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "compare_products";

type CompareProduct = {
  id: string;
  model: string;
  coverImage: string | null;
  translations: { locale: string; name: string }[];
  productLine: {
    code: string;
    translations: { locale: string; name: string }[];
    brand: { translations: { locale: string; name: string }[] };
  };
  paramValues: {
    paramDefinition: {
      key: string;
      unit: string | null;
      translations: { locale: string; name: string }[];
    };
    valueNumber: number | null;
    valueString: string | null;
    valueBoolean: boolean | null;
    valueMin: number | null;
    valueMax: number | null;
    isHighlight: boolean | null;
  }[];
};

function fmtVal(pv: CompareProduct["paramValues"][0]): string {
  if (pv.valueBoolean !== null && pv.valueBoolean !== undefined)
    return pv.valueBoolean ? "支持" : "不支持";
  if (pv.valueNumber !== null && pv.valueNumber !== undefined) return String(pv.valueNumber);
  if (pv.valueMin !== null || pv.valueMax !== null)
    return `${pv.valueMin ?? "?"} ~ ${pv.valueMax ?? "?"}`;
  return pv.valueString ?? "-";
}

export default function CompareTable({ products }: { products: CompareProduct[] }) {
  const [list, setList] = useState<{ id: string; model: string }[]>([]);

  useEffect(() => {
    try {
      setList(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      setList([]);
    }
  }, []);

  function remove(id: string) {
    const next = list.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setList(next);
    if (next.length === 0) window.location.href = "/compare";
  }

  function syncAll() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // 参数行：key -> {zh, en, unit, values[]}
  const paramMap = new Map<
    string,
    { key: string; zh: string; en: string; unit: string | null; values: string[]; highlight: boolean[] }
  >();
  for (const p of products) {
    for (const pv of p.paramValues) {
      const def = pv.paramDefinition;
      const dt = Object.fromEntries(def.translations.map((tr) => [tr.locale, tr]));
      const val = fmtVal(pv);
      if (!paramMap.has(def.key)) {
        paramMap.set(def.key, {
          key: def.key,
          zh: dt["zh"]?.name ?? def.key,
          en: dt["en"]?.name ?? def.key,
          unit: def.unit,
          values: [],
          highlight: [],
        });
      }
      const row = paramMap.get(def.key)!;
      row.values.push(val);
      row.highlight.push(pv.isHighlight === true);
    }
  }
  // 补充缺失产品的"-"
  for (const [, row] of paramMap) {
    while (row.values.length < products.length) {
      row.values.push("-");
      row.highlight.push(false);
    }
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="w-32 px-4 py-3 text-left font-semibold text-slate-500">参数</th>
            {products.map((p) => {
              const pt = Object.fromEntries(p.translations.map((tr) => [tr.locale, tr]));
              const bt = Object.fromEntries(p.productLine.brand.translations.map((tr) => [tr.locale, tr]));
              return (
                <th key={p.id} className="px-4 py-3 text-left">
                  <div className="font-mono font-bold text-slate-900">{p.model}</div>
                  <div className="mt-0.5 text-xs font-normal text-slate-500">{pt["zh"]?.name}</div>
                  <div className="text-xs font-normal text-slate-400">{bt["zh"]?.name}</div>
                  <div className="mt-2 flex gap-2">
                    <Link
                      href={`/products/${encodeURIComponent(p.model)}`}
                      className="rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-500"
                    >
                      详情
                    </Link>
                    <Link
                      href={`/contact`}
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    >
                      询价
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="rounded border border-slate-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                    >
                      移除
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {[...paramMap.entries()].map(([key, row], rowIdx) => {
            // 差异检测：去重后唯一值是否>1
            const unique = new Set(row.values);
            const hasDiff = unique.size > 1;
            return (
              <tr key={key} className={rowIdx % 2 ? "bg-slate-50/50" : "bg-white"}>
                <td className="border-t border-slate-100 px-4 py-2.5 text-slate-500">
                  {row.zh}
                  {row.en && <span className="ml-1 text-xs text-slate-300">{row.en}</span>}
                </td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className={`border-t border-slate-100 px-4 py-2.5 font-medium ${
                      hasDiff ? "bg-amber-50 text-slate-800" : "text-slate-700"
                    }`}
                  >
                    {v}
                    {hasDiff && row.highlight[i] && (
                      <span className="ml-1 rounded bg-rose-100 px-1 text-xs text-rose-600">卖点</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
          {paramMap.size === 0 && (
            <tr>
              <td colSpan={products.length + 1} className="px-4 py-8 text-center text-slate-400">
                这些产品暂无参数，无法对比
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
