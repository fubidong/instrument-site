import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import { canonicalParamName } from "@/lib/param-alias";

export const metadata = { title: "产品对比 | 仪器仪表" };

function fmtValue(pv: any): string {
  if (pv.valueString) return pv.valueString;
  if (pv.valueBoolean != null) return pv.valueBoolean ? "Yes" : "No";
  if (pv.valueNumber != null) return String(pv.valueNumber);
  if (pv.valueMin != null && pv.valueMax != null) return `${pv.valueMin} ~ ${pv.valueMax}`;
  if (pv.valueMin != null) return `${pv.valueMin} ~`;
  return "-";
}

/** 解析 specsOverview（"名：值" 每行） */
function parseSpecs(overview: string | null): { name: string; value: string }[] {
  if (!overview) return [];
  return overview
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const idx = l.indexOf("：");
      if (idx > 0) return { name: l.slice(0, idx).trim(), value: l.slice(idx + 1).trim() };
      return { name: l, value: "" };
    })
    .filter((r) => r.name && r.value);
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const sp = await searchParams;

  const ids = sp.ids?.split(",").filter(Boolean) ?? [];
  const lineId = sp.line;
  if (ids.length === 0 && !lineId) notFound();

  const products = await db.product.findMany({
    where: lineId
      ? { productLineId: lineId, isActive: true }
      : { id: { in: ids }, isActive: true },
    include: {
      productLine: { include: { brand: { include: { translations: true } }, translations: true } },
      translations: true,
      paramValues: {
        include: {
          paramDefinition: {
            include: { translations: true, paramGroup: { include: { translations: true } } },
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { model: "asc" }],
  });
  if (products.length === 0) notFound();

  // 按参数名对齐（归一化）：name -> { groupName, unit, order, values: {productId: value} }
  type Row = {
    name: string;
    groupName: string;
    unit: string | null;
    values: Record<string, string>;
  };
  const rowMap = new Map<string, Row>();
  for (const p of products) {
    // 1. paramValues（结构化，带组）
    for (const pv of p.paramValues) {
      const def = pv.paramDefinition;
      const rawNm = t(def.translations, locale, "name") || t(def.translations, "zh", "name") || def.key;
      const nm = canonicalParamName(rawNm);
      let row = rowMap.get(nm);
      if (!row) {
        const g = def.paramGroup;
        row = {
          name: nm,
          groupName: t(g.translations, locale, "name") || t(g.translations, "zh", "name") || g.code,
          unit: def.unit,
          values: {},
        };
        rowMap.set(nm, row);
      }
      if (row.values[p.id] === undefined) row.values[p.id] = fmtValue(pv);
    }
    // 2. specsOverview（补充，按名对齐；同名并入，不覆盖已有结构化值）
    // 英文站跳过中文文本行（避免中英混排；当前 specsOverview 的 en 翻译仍是中文）
    const pt = p.translations.find((tr) => tr.locale === locale);
    let specRows = parseSpecs(pt?.specsOverview ?? null);
    if (locale === "en") specRows = specRows.filter((r) => !/[\u4e00-\u9fff]/.test(r.name));
    for (const sr of specRows) {
      const nm = canonicalParamName(sr.name);
      let row = rowMap.get(nm);
      if (!row) {
        row = { name: nm, groupName: "规格参数", unit: null, values: {} };
        rowMap.set(nm, row);
      }
      if (row.values[p.id] === undefined) row.values[p.id] = sr.value;
    }
  }
  const rows = [...rowMap.values()];
  // 排序：组顺序（结构化组在前，规格参数在后），再按行内顺序
  const rowsWithOrder = rows.map((r, i) => ({ ...r, _order: i }));
  const groupOrder = new Map<string, number>();
  let gi = 0;
  for (const r of rowsWithOrder) {
    if (!groupOrder.has(r.groupName)) groupOrder.set(r.groupName, gi++);
  }
  rowsWithOrder.sort(
    (a, b) => (groupOrder.get(a.groupName)! - groupOrder.get(b.groupName)!) || (a._order - b._order)
  );
  const groups: { name: string; rows: { name: string; unit: string | null; values: Record<string, string> }[] }[] = [];
  for (const r of rowsWithOrder) {
    const last = groups[groups.length - 1];
    if (last && last.name === r.groupName) last.rows.push(r);
    else groups.push({ name: r.groupName, rows: [r] });
  }

  const I = {
    back: isEn ? "Back to Products" : "返回产品中心",
    compare: isEn ? "Model Comparison" : "型号对比",
    seriesCompare: isEn ? "Series Comparison" : "系列参数对比",
    model: isEn ? "Model" : "型号",
    parameter: isEn ? "Parameter" : "参数",
    brand: isEn ? "Brand" : "品牌",
    series: isEn ? "Series" : "系列",
    noValue: isEn ? "N/A" : "—",
    addMore: isEn ? "Add More" : "继续添加",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {lineId ? I.seriesCompare : I.compare}
            <span className="ml-2 text-sm font-normal text-slate-400">
              {products.length} {I.model}
            </span>
          </h1>
        </div>
        <Link href={`/products`} className="text-sm text-sky-600 hover:underline">
          ← {I.back}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="w-40 border-r border-slate-100 bg-slate-50 px-3 py-3 text-left text-xs font-semibold text-slate-500">
                {I.parameter}
              </th>
              {products.map((p) => {
                const pt = Object.fromEntries(p.translations.map((tr) => [tr.locale, tr]));
                const bt = Object.fromEntries(
                  p.productLine.brand.translations.map((tr) => [tr.locale, tr])
                );
                const lt = Object.fromEntries(
                  p.productLine.translations.map((tr) => [tr.locale, tr])
                );
                return (
                  <th key={p.id} className="min-w-[150px] border-r border-slate-100 bg-slate-50 px-3 py-3 align-top">
                    <Link
                      href={`/products/${encodeURIComponent(p.model)}`}
                      className="block text-center"
                    >
                      {p.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverImage} alt={p.model} className="mx-auto h-20 w-24 object-contain" />
                      ) : (
                        <div className="mx-auto flex h-20 w-24 items-center justify-center bg-slate-100 text-slate-300">
                          {I.noValue}
                        </div>
                      )}
                      <div className="mt-2 font-mono text-xs font-bold text-slate-800">{p.model}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {bt[locale]?.name ?? bt["zh"]?.name ?? ""} ·{" "}
                        {lt[locale]?.name ?? lt["zh"]?.name ?? p.productLine.code}
                      </div>
                      {pt[locale]?.name && (
                        <div className="mt-0.5 text-[11px] text-slate-500">{pt[locale].name}</div>
                      )}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GroupRows key={g.name} group={g} products={products} labels={{ noValue: I.noValue, brand: I.brand, series: I.series }} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/products"
          className="rounded-md border border-sky-300 px-5 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
        >
          + {I.addMore}
        </Link>
      </div>
    </div>
  );
}

function GroupRows({
  group,
  products,
  labels,
}: {
  group: { name: string; rows: { name: string; unit: string | null; values: Record<string, string> }[] };
  products: { id: string }[];
  labels: { noValue: string; brand: string; series: string };
}) {
  return (
    <>
      <tr>
        <td colSpan={products.length + 1} className="border-b border-r border-slate-100 bg-sky-50/60 px-3 py-2 text-xs font-bold text-sky-800">
          {group.name}
        </td>
      </tr>
      {group.rows.map((r) => (
        <tr key={r.name} className="odd:bg-white even:bg-slate-50/40">
          <td className="border-r border-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            {r.name}
            {r.unit && <span className="ml-0.5 text-[10px] text-slate-400">{r.unit}</span>}
          </td>
          {products.map((p) => (
            <td key={p.id} className="border-r border-slate-100 px-3 py-2 text-center text-xs text-slate-700">
              {r.values[p.id] ?? <span className="text-slate-300">{labels.noValue}</span>}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
