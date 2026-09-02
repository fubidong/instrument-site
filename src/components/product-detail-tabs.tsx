"use client";

import { useState } from "react";
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
  customTabs,
  labels,
}: {
  intro?: string | null;
  highlights?: { name: string; value: string; unit?: string }[];
  paramGroups?: ParamGroup[];
  selection?: string | null;
  pdfs?: PdfDoc[];
  customTabs?: CustomTab[];
  labels: {
    intro: string;
    params: string;
    selection?: string;
    manual?: string;
    download?: string;
    highlight?: string;
    noParams?: string;
  };
}) {
  const [active, setActive] = useState(0);
  const [pdfIdx, setPdfIdx] = useState(0);

  const baseTabs: { key: string; title: string }[] = [
    { key: "intro", title: labels.intro },
    { key: "params", title: labels.params },
  ];
  const hasSelection = !!selection && selection.trim().length > 0 && !/^(<p>(\s|&nbsp;)*<\/p>|<br\s*\/?>|\s)*$/i.test(selection);
  const hasPdf = !!pdfs && pdfs.length > 0;
  if (hasSelection) baseTabs.push({ key: "selection", title: labels.selection ?? "产品选型" });
  if (hasPdf) baseTabs.push({ key: "pdf", title: labels.manual ?? "产品规格手册" });
  const tabs = [...baseTabs, ...(customTabs ?? []).map((t, i) => ({ key: `custom-${i}`, title: t.title }))];

  const introVisible = !!intro || (highlights && highlights.length > 0);
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
                {highlights && highlights.length > 0 && (
                  <div>
                    {labels.highlight && (
                      <div className="mb-2 text-sm font-semibold text-slate-800">{labels.highlight}</div>
                    )}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {highlights.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-md bg-rose-50 px-3 py-2"
                        >
                          <span className="text-sm text-slate-600">{h.name}</span>
                          <span className="font-semibold text-rose-600">
                            {h.value}
                            {h.unit && <span className="ml-0.5 text-xs">{h.unit}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                            <td className="min-w-40 whitespace-nowrap px-4 py-2.5 text-slate-500">
                              {it.name}
                              {it.zhName && it.zhName !== it.name && (
                                <span className="ml-1 text-xs text-slate-300">{it.zhName}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-slate-800">
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
              <div className="rich-text">
                <div
                  dangerouslySetInnerHTML={{
                    __html: /<[a-z][\s\S]*>/i.test(selection ?? "")
                      ? selection!
                      : `<p>${selection}</p>`,
                  }}
                />
              </div>
            )}

            {activeTab.key === "pdf" && pdfs && pdfs.length > 0 && (
              <div className="space-y-4">
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
