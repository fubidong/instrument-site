"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ParamGroupItem = { name: string; zhName?: string; value: string; unit?: string };
export type ParamGroup = { groupName: string; items: ParamGroupItem[] };
export type CustomTab = { code: string; title: string; content: string };

/**
 * 产品详情页选项卡（产品介绍 / 技术参数 / 品类自定义），平滑切换
 */
export default function ProductDetailTabs({
  intro,
  highlights,
  paramGroups,
  customTabs,
  labels,
}: {
  intro?: string | null;
  highlights?: { name: string; value: string; unit?: string }[];
  paramGroups?: ParamGroup[];
  customTabs?: CustomTab[];
  labels: {
    intro: string;
    params: string;
    highlight?: string;
    noParams?: string;
  };
}) {
  const [active, setActive] = useState(0);
  const tabs: { key: string; title: string }[] = [
    { key: "intro", title: labels.intro },
    { key: "params", title: labels.params },
    ...(customTabs ?? []).map((t, i) => ({ key: `custom-${i}`, title: t.title })),
  ];

  const introVisible = !!intro || (highlights && highlights.length > 0);
  const paramsVisible = (paramGroups ?? []).length > 0;
  // 过滤出有内容的 tab（产品介绍/技术参数无内容则不显示）
  const visibleTabs = tabs.filter((t) => {
    if (t.key === "intro") return introVisible;
    if (t.key === "params") return paramsVisible;
    return true;
  });
  if (visibleTabs.length === 0) return null;

  // 修正 active 索引
  const current = Math.min(active, visibleTabs.length - 1);
  const activeTab = visibleTabs[current];

  return (
    <div>
      {/* 选项卡头 */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {visibleTabs.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-t-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
              current === i
                ? "border-b-2 border-sky-600 text-sky-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* 内容区：平滑切换 */}
      <div className="mt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
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
                {intro && (
                  <div className="whitespace-pre-line text-sm leading-7 text-slate-600">{intro}</div>
                )}
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

            {activeTab.key.startsWith("custom-") && (
              <div className="prose max-w-none text-sm leading-7 text-slate-700">
                <div
                  dangerouslySetInnerHTML={{
                    __html: customTabs![parseInt(activeTab.key.split("-")[1])].content,
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
