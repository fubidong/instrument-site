"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

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

function fmtVal(pv: CompareProduct["paramValues"][0], isEn: boolean): string {
  if (pv.valueBoolean !== null && pv.valueBoolean !== undefined)
    return pv.valueBoolean ? (isEn ? "Yes" : "支持") : isEn ? "No" : "不支持";
  if (pv.valueNumber !== null && pv.valueNumber !== undefined) return String(pv.valueNumber);
  if (pv.valueMin !== null || pv.valueMax !== null)
    return `${pv.valueMin ?? "?"} ~ ${pv.valueMax ?? "?"}`;
  return pv.valueString ?? "-";
}

export default function CompareTable({
  locale,
  products,
}: {
  locale: string;
  products: CompareProduct[];
}) {
  const isEn = locale === "en";
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

  const L = {
    param: isEn ? "Parameter" : "参数",
    detail: isEn ? "Details" : "详情",
    inquiry: isEn ? "Inquiry" : "询价",
    remove: isEn ? "Remove" : "移除",
    noParams: isEn ? "No parameters available to compare" : "这些产品暂无参数，无法对比",
    highlight: isEn ? "Feature" : "卖点",
  };

  const paramMap = new Map<
    string,
    { key: string; name: string; zhName: string; unit: string | null; values: string[]; highlight: boolean[] }
  >();
  for (const p of products) {
    for (const pv of p.paramValues) {
      const def = pv.paramDefinition;
      const dt = Object.fromEntries(def.translations.map((tr) => [tr.locale, tr]));
      const val = fmtVal(pv, isEn);
      if (!paramMap.has(def.key)) {
        paramMap.set(def.key, {
          key: def.key,
          name: dt[locale]?.name ?? dt["zh"]?.name ?? def.key,
          zhName: dt["zh"]?.name ?? def.key,
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
            <th className="w-32 px-4 py-3 text-left font-semibold text-slate-500">{L.param}</th>
            {products.map((p) => {
              const pt = Object.fromEntries(p.translations.map((tr) => [tr.locale, tr]));
              const bt = Object.fromEntries(p.productLine.brand.translations.map((tr) => [tr.locale, tr]));
              return (
                <th key={p.id} className="px-4 py-3 text-left">
                  <div className="font-mono font-bold text-slate-900">{p.model}</div>
                  <div className="mt-0.5 text-xs font-normal text-slate-500">
                    {pt[locale]?.name ?? pt["zh"]?.name}
                  </div>
                  <div className="text-xs font-normal text-slate-400">
                    {bt[locale]?.name ?? bt["zh"]?.name}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Link
                      href={`/products/${encodeURIComponent(p.model)}`}
                      className="rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-500"
                    >
                      {L.detail}
                    </Link>
                    <Link
                      href={`/contact`}
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    >
                      {L.inquiry}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="rounded border border-slate-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                    >
                      {L.remove}
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {[...paramMap.entries()].map(([key, row], rowIdx) => {
            const unique = new Set(row.values);
            const hasDiff = unique.size > 1;
            return (
              <tr key={key} className={rowIdx % 2 ? "bg-slate-50/50" : "bg-white"}>
                <td className="border-t border-slate-100 px-4 py-2.5 text-slate-500">
                  {row.name}
                  {row.zhName && row.name !== row.zhName && (
                    <span className="ml-1 text-xs text-slate-300">{row.zhName}</span>
                  )}
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
                      <span className="ml-1 rounded bg-rose-100 px-1 text-xs text-rose-600">
                        {L.highlight}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
          {paramMap.size === 0 && (
            <tr>
              <td colSpan={products.length + 1} className="px-4 py-8 text-center text-slate-400">
                {L.noParams}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
