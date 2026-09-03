"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export type ParamGroupItem = { name: string; zhName?: string; value: string; unit?: string };
export type ParamGroup = { groupName: string; items: ParamGroupItem[] };
export type CustomTab = { code: string; title: string; content: string };
export type PdfDoc = { id: string; title: string; filePath: string; docType?: string };

/**
 * 产品详情页选项卡（产品介绍 / 技术参数 / 产品选型 / 产品规格手册 / 品类自定义）
 * 平滑切换 + 下划线高亮反馈
 */
export default function ProductDetailTabs({
  intro,
  highlights,
  paramGroups,
  selection,
  pdfs,
  downloads,
  customTabs,
  labels,
}: {
  intro?: string | null;
  highlights?: { name: string; value: string; unit?: string }[];
  paramGroups?: ParamGroup[];
  selection?: string | null;
  pdfs?: PdfDoc[];
  downloads?: PdfDoc[];
  customTabs?: CustomTab[];
  labels: {
    intro: string;
    params: string;
    selection?: string;
    manual?: string;
    download?: string;
    downloads?: string;
    highlight?: string;
    noParams?: string;
    noManual?: string;
    noDownloads?: string;
  };
}) {
  const [active, setActive] = useState(0);
  const [pdfIdx, setPdfIdx] = useState(0);
  const selRef = useRef<HTMLDivElement>(null);

  const baseTabs: { key: string; title: string }[] = [
    { key: "intro", title: labels.intro },
    { key: "params", title: labels.params },
  ];
  const hasSelection = !!selection && selection.trim().length > 0 && !/^(<p>(\s|&nbsp;)*<\/p>|<br\s*\/?>|\s)*$/i.test(selection);
  // 规格手册固定显示（无 PDF 时内容区显示空状态提示）
  const hasPdf = true;
  if (hasSelection) baseTabs.push({ key: "selection", title: labels.selection ?? "产品选型" });
  if (hasPdf) baseTabs.push({ key: "pdf", title: labels.manual ?? "产品规格手册" });
  const hasDownloads = !!downloads && downloads.length > 0;
  if (hasDownloads) baseTabs.push({ key: "downloads", title: labels.downloads ?? "资料下载" });
  const tabs = [...baseTabs, ...(customTabs ?? []).map((t, i) => ({ key: `custom-${i}`, title: t.title }))];

  // 产品介绍固定显示
  const introVisible = true;
  // 技术参数固定显示（无参数时内容区显示空状态提示）
  const paramsVisible = true;
  // 过滤出有内容的 tab
  const visibleTabs = tabs.filter((t) => {
    if (t.key === "intro") return introVisible;
    if (t.key === "params") return paramsVisible;
    return true;
  });
  if (visibleTabs.length === 0) return null;

  // 修正 active 索引
  const current = Math.min(active, visibleTabs.length - 1);
  const activeTab = visibleTabs[current];
  const currentPdf = pdfs![Math.min(pdfIdx, pdfs!.length - 1)];

  // 选型表对齐：表头全部居中；型号列居中；其余列按内容长度自动判断（短参数居中、长文本居左）
  useEffect(() => {
    if (activeTab?.key !== "selection" || !selRef.current) return;
    const tables = selRef.current.querySelectorAll(".product-selection-table table");
    tables.forEach((tbl) => {
      const rows = Array.from(tbl.querySelectorAll("tbody tr")) as HTMLTableRowElement[];
      if (rows.length === 0) return;
      const colCount = rows[0].cells.length;
      // 表头全部居中
      tbl.querySelectorAll("th").forEach((th) => {
        (th as HTMLElement).style.textAlign = "center";
      });
      // 型号列（第 0 列）居中
      rows.forEach((row) => {
        if (row.cells[0]) row.cells[0].style.textAlign = "center";
      });
      // 其余列：按该列最长文本判断（>18 字符视为长文本 → 居左，否则居中）
      for (let ci = 1; ci < colCount; ci++) {
        let maxLen = 0;
        rows.forEach((row) => {
          if (row.cells[ci]) maxLen = Math.max(maxLen, (row.cells[ci].textContent || "").trim().length);
        });
        const align = maxLen > 18 ? "left" : "center";
        rows.forEach((row) => {
          if (row.cells[ci]) row.cells[ci].style.textAlign = align;
        });
      }
    });
  }, [activeTab?.key, selection]);

  return (
    <div>
      {/* 选项卡头：下划线 + 颜色高亮 */}
      <div className="flex flex-wrap gap-1 overflow-x-auto border-b border-slate-200">
        {visibleTabs.map((tab, i) => {
          const isActive = current === i;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActive(i);
                if (tab.key === "pdf") setPdfIdx(0);
              }}
              className={`relative whitespace-nowrap px-5 py-3 text-sm font-semibold transition-colors ${
                isActive ? "text-sky-700" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.title}
              <span
                className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-sky-600 transition-all duration-300 ${
                  isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* 内容区：平滑切换（key 直接替换 + 位移动画，无 exit 依赖，内容始终可见） */}
      <div className="mt-5">
        <motion.div
          key={activeTab.key}
          initial={{ y: 8, opacity: 0.6 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
            {activeTab.key === "intro" && (
              <div className="space-y-4">
                {intro && (/<[a-z][\s\S]*>/i.test(intro) ? (
                  <div className="rich-text" dangerouslySetInnerHTML={{ __html: intro }} />
                ) : (
                  <div className="whitespace-pre-line text-sm leading-7 text-slate-600">{intro}</div>
                ))}
              </div>
            )}

            {activeTab.key === "params" && (
              <div className="space-y-4">
                {(paramGroups ?? []).map((g, gi) => (
                  <div key={gi} className="overflow-hidden rounded-lg border border-slate-200">
                    <div className="bg-slate-50 px-4 py-2">
                      <span className="text-sm font-semibold text-slate-700">{g.groupName}</span>
                    </div>
                    <table className="w-full bg-white text-sm">
                      <tbody>
                        {g.items.map((it, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                            <td className="w-1/3 whitespace-nowrap px-3 py-1.5 text-slate-500">
                              {it.name}
                              {it.zhName && it.zhName !== it.name && (
                                <span className="ml-1 text-xs text-slate-300">{it.zhName}</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 font-medium text-slate-800">
                              {it.value}
                              {it.unit && <span className="ml-1 text-xs text-slate-400">{it.unit}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                {(paramGroups ?? []).length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    {labels.noParams}
                  </div>
                )}
              </div>
            )}

            {activeTab.key === "selection" && (
              <div className="rich-text" ref={selRef}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: /<[a-z][\s\S]*>/i.test(selection ?? "")
                      ? selection!
                      : `<p>${selection}</p>`,
                  }}
                />
              </div>
            )}

            {activeTab.key === "pdf" && (
              <div className="space-y-4">
                {!pdfs || pdfs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    {labels.noManual ?? "暂无规格手册"}
                  </div>
                ) : (
                  <>
                    {pdfs.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {pdfs.map((p, i) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPdfIdx(i)}
                            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                              i === Math.min(pdfIdx, pdfs.length - 1)
                                ? "border-sky-500 bg-sky-50 font-medium text-sky-700"
                                : "border-slate-200 text-slate-500 hover:border-sky-300"
                            }`}
                          >
                            {p.title}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      {/* eslint-disable-next-line react/no-unknown-property */}
                      <embed src={currentPdf.filePath} type="application/pdf" className="h-[68vh] w-full" />
                    </div>
                    <div className="flex justify-end">
                      <a
                        href={currentPdf.filePath}
                        download
                        className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        {labels.download ?? "下载 PDF"}
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab.key === "downloads" && (
              <div className="space-y-3">
                {(downloads ?? []).map((d) => {
                  const isExternal = /^https?:\/\//i.test(d.filePath);
                  const typeLabel =
                    d.docType === "datasheet" ? "数据手册"
                    : d.docType === "programming_manual" ? "编程手册"
                    : d.docType === "user_manual" ? "用户手册"
                    : d.docType === "application_note" ? "应用笔记"
                    : "资料";
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-sky-300"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-rose-50 text-rose-600">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-800">{d.title}</div>
                          <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                            {typeLabel}
                          </span>
                        </div>
                      </div>
                      <a
                        href={d.filePath}
                        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : { download: true })}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-sky-600 px-3 py-1.5 text-sm font-medium text-sky-600 transition hover:bg-sky-50"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        下载
                      </a>
                    </div>
                  );
                })}
                {(downloads ?? []).length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    {labels.noDownloads ?? "暂无资料下载"}
                  </div>
                )}
              </div>
            )}

            {activeTab.key.startsWith("custom-") && (
              <div className="rich-text">
                <div
                  dangerouslySetInnerHTML={{
                    __html: customTabs![parseInt(activeTab.key.split("-")[1])].content,
                  }}
                />
              </div>
            )}
          </motion.div>
        </div>
    </div>
  );
}
