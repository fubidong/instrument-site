"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ProductPdfViewer from "./product-pdf-viewer";

export type ParamGroupItem = { name: string; zhName?: string; value: string; unit?: string };
export type ParamGroup = { groupName: string; items: ParamGroupItem[] };
export type CustomTab = { code: string; title: string; content: string };
export type PdfDoc = { id: string; title: string; filePath: string; docType?: string };

// 国仪量子等官网 v2 模板的产品介绍：外包 product-page-v2__desktop 外壳，使官网模块 CSS 生效
function wrapCiqIntro(html: string, force: boolean): string {
  if (force || /class="[^"]*(product-style-intro|figma-|content-block|content[1-9]|item-|ppv2-|product-page-v2|params-|el-row|row\d|common-wrapper)[^"]*"/.test(html)) {
    if (!/<div class="product-page-v2__desktop"/.test(html)) {
      return `<div class="product-page-v2__desktop">${html}</div>`;
    }
  }
  return html;
}

/**
 * 剥离产品介绍内嵌 <style> 中的全局规则（html/body/:root/*），
 * 防止官网采集带进来的 font-size/overflow 等样式泄漏到整站（如 html{font-size:5.2083vw} 会把根字号放大到 55px）。
 * 仅移除明确作用于全局的选择器块，保留类/ID 作用域的官网区块样式。
 */
function sanitizeEmbeddedCss(html: string): string {
  return html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, css: string) => {
    const cleaned = stripGlobalCssRules(css);
    return cleaned ? `<style>${cleaned}</style>` : "";
  });
}

function stripGlobalCssRules(css: string): string {
  // 统一移除注释（CSS 注释不影响语义），避免注释并入选择器文本污染全局规则判断
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return stripInner(noComments).trim();
}

function stripInner(css: string): string {
  let out = "";
  let i = 0;
  const n = css.length;
  while (i < n) {
    const ob = css.indexOf("{", i);
    if (ob < 0) {
      out += css.slice(i);
      break;
    }
    const sel = css.slice(i, ob);
    // 找匹配的 }（CSS 扁平无嵌套，但安全起见计数）
    let depth = 1;
    let j = ob + 1;
    while (j < n && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const block = css.slice(ob, j);
    const s = sel.trim();
    // 媒体查询/容器查询/字体声明：递归剥离内部全局规则，保留外壳
    const isAtRule = /^@media/i.test(s) || /^@supports/i.test(s) || /^@font-face/i.test(s);
    if (isAtRule) {
      const inner = block.slice(1, -1);
      const cleanedInner = stripInner(inner);
      if (cleanedInner.trim()) out += sel + "{" + cleanedInner + "}";
      i = j;
      continue;
    }
    // 取最后一个 ; 或 } 之后的部分作为真正选择器（绕开 @charset/@import 等以;结尾的语句）
    const selTail = s.split(/[};]/).pop().trim();
    // 泄漏面：所有不含 . # [ 的选择器（裸标签/标签组/伪类）都会经 dangerouslySetInnerHTML
    // 污染整站（a/ul/li/header/nav/div/p/table/td/h1-h6/button 等），一律剥离；
    // 仅保留依赖类/ID/属性选择器的官网区块样式（.sect04/.sect05/.prod_det1 等）
    const isGlobal = !/[.#\[]/.test(selTail);
    if (!isGlobal) out += sel + block;
    i = j;
  }
  return out;
}

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
  specsHtml,
  coverImage,
  ciqShell,
  labels,
}: {
  intro?: string | null;
  highlights?: { name: string; value: string; unit?: string }[];
  paramGroups?: ParamGroup[];
  selection?: string | null;
  pdfs?: PdfDoc[];
  downloads?: PdfDoc[];
  customTabs?: CustomTab[];
  specsHtml?: string | null;
  coverImage?: string | null;
  ciqShell?: boolean;
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
    noTabContent?: string;
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
  const currentPdf = (pdfs && pdfs.length > 0) ? pdfs![Math.min(pdfIdx, pdfs!.length - 1)] : undefined;

  // 官网表格内联固定列宽（width="xxx" / style width）会挤压/截断，预处理移除让表格自适应容器
  const cleanTableWidth = (html: string) =>
    html
      .replace(/\swidth="\d+"/gi, "")
      .replace(/\swidth:\s*\d+px/gi, "")
      .replace(/\swidth:\s*\d+%/gi, "")
      .replace(/<colgroup>[\s\S]*?<\/colgroup>/gi, "");

  // 产品选型表：在 cleanTableWidth 基础上给无类名的裸 <table> 注入 product-selection-table 类，
  // 让自适应/列宽/对齐样式与对齐逻辑生效（采集的选型表常为裸 <table>；已有专属类的表保持不动）
  const cleanSelectionTable = (html: string) =>
    cleanTableWidth(html).replace(/<table(?![^>]*\bclass=)[^>]*>/gi, '<table class="product-selection-table">');

  // 选型表对齐：表头全部居中；型号列居中；其余列按内容长度自动判断（短参数居中、长文本居左）
  useEffect(() => {
    if (activeTab?.key !== "selection" || !selRef.current) return;
    const tables = selRef.current.querySelectorAll(".product-selection-table table, .it-model-table table");
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

  // 产品介绍图片轮播初始化
  useEffect(() => {
    if (activeTab?.key !== "intro") return;
    const carousels = document.querySelectorAll(".uni-intro-carousel");
    const timers: ReturnType<typeof setInterval>[] = [];
    
    carousels.forEach((carousel) => {
      const track = carousel.querySelector(".uni-intro-carousel-track") as HTMLElement | null;
      if (!track) return;
      const imgs = track.querySelectorAll(".uni-intro-img");
      if (imgs.length <= 1) return;
      
      // 移除旧的指示点
      carousel.querySelectorAll(".uni-intro-carousel-dots").forEach(d => d.remove());
      
      // 创建指示点容器
      const dotsContainer = document.createElement("div");
      dotsContainer.className = "uni-intro-carousel-dots";
      imgs.forEach((_, idx) => {
        const dot = document.createElement("div");
        dot.className = `uni-intro-carousel-dot${idx === 0 ? " active" : ""}`;
        dot.addEventListener("click", () => {
          currentIdx = idx;
          updateSlide();
          resetTimer();
        });
        dotsContainer.appendChild(dot);
      });
      carousel.appendChild(dotsContainer);
      
      let currentIdx = 0;
      
      const updateSlide = () => {
        track.style.transform = `translateX(-${currentIdx * 100}%)`;
        dotsContainer.querySelectorAll(".uni-intro-carousel-dot").forEach((dot, idx) => {
          dot.classList.toggle("active", idx === currentIdx);
        });
      };
      
      const startTimer = () => {
        return setInterval(() => {
          currentIdx = (currentIdx + 1) % imgs.length;
          updateSlide();
        }, 3000);
      };
      
      let timer = startTimer();
      timers.push(timer);
      
      const resetTimer = () => {
        clearInterval(timer);
        timer = startTimer();
        timers.push(timer);
      };
      
      // 鼠标悬停暂停
      carousel.addEventListener("mouseenter", () => clearInterval(timer));
      carousel.addEventListener("mouseleave", () => { timer = startTimer(); timers.push(timer); });
    });
    
    return () => {
      timers.forEach(t => clearInterval(t));
    };
  }, [activeTab?.key, intro]);

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
              className={`relative whitespace-nowrap px-5 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                isActive ? "text-primary" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.title}
              <span
                className={`absolute inset-x-3 -bottom-px h-0.5 bg-primary transition-transform duration-200 ${
                  isActive ? "scale-x-100" : "scale-x-0"
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
                  <div className="rich-text" dangerouslySetInnerHTML={{ __html: sanitizeEmbeddedCss(wrapCiqIntro(intro, !!ciqShell)) }} />
                ) : (
                  <div className="whitespace-pre-line text-sm leading-7 text-slate-600">{intro}</div>
                ))}
              </div>
            )}

            {activeTab.key === "params" && (
              <div className="space-y-4">
                {specsHtml ? (
                  <SpecsCollapsible html={cleanTableWidth(specsHtml)} />
                ) : (
                  <>
                {(paramGroups ?? []).map((g, gi) => (
                  <section key={gi} className="ui-card" aria-label={g.groupName}>
                    <div className="px-4 pb-1 pt-4 sm:px-5">
                      <h3 className="ui-eyebrow">{g.groupName}</h3>
                    </div>

                    {/* 桌面：完整规格表（th/td 发丝线，ui-spec-table） */}
                    <div className="hidden px-2 pb-1 md:block">
                      <table className="ui-spec-table">
                        <tbody>
                          {g.items.map((it, idx) =>
                            it.name ? (
                              <tr key={idx}>
                                <th className="w-2/5 font-medium">
                                  {it.name}
                                  {it.zhName && it.zhName !== it.name && (
                                    <span className="ml-1 text-xs font-normal text-slate-400">{it.zhName}</span>
                                  )}
                                </th>
                                <td className="ui-num">
                                  {it.value}
                                  {it.unit && (
                                    <span className="ml-1 font-sans text-xs font-normal text-slate-500">{it.unit}</span>
                                  )}
                                </td>
                              </tr>
                            ) : (
                              <tr key={idx}>
                                <td colSpan={2} className="ui-num">{it.value}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* 移动端：卡片式（左标签 右值），不横向滚动、不裁切 */}
                    <div className="space-y-2 px-3 pb-3 pt-1 md:hidden">
                      {g.items.map((it, idx) =>
                        it.name ? (
                          <div key={idx} className="ui-card px-3.5 py-2.5">
                            <div className="flex items-start justify-between gap-3">
                              <span className="min-w-0 pt-0.5 text-xs leading-5 text-slate-500">
                                {it.name}
                                {it.zhName && it.zhName !== it.name && (
                                  <span className="ml-1 text-[10px] text-slate-400">{it.zhName}</span>
                                )}
                              </span>
                              <span className="ui-num min-w-0 shrink text-right break-words text-sm font-semibold leading-5 text-slate-900">
                                {it.value}
                                {it.unit && (
                                  <span className="ml-0.5 font-sans text-xs font-normal text-slate-500">{it.unit}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div key={idx} className="ui-card ui-num break-words px-3.5 py-2.5 text-sm text-slate-900">
                            {it.value}
                          </div>
                        )
                      )}
                    </div>
                  </section>
                ))}
                {(paramGroups ?? []).length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    {labels.noParams}
                  </div>
                )}
                  </>
                )}
              </div>
            )}

            {activeTab.key === "selection" && (
              <div className="rich-text" ref={selRef}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: /<[a-z][\s\S]*>/i.test(selection ?? "")
                      ? cleanSelectionTable(selection!)
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
                                ? "border-primary font-medium text-primary"
                                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                            }`}
                          >
                            {p.title}
                          </button>
                        ))}
                      </div>
                    )}
                    <ProductPdfViewer src={currentPdf!.filePath} title={currentPdf!.title} />
                    <div className="flex justify-end">
                      <a
                        href={currentPdf.filePath}
                        download
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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
                      className="flex items-center justify-between gap-3 border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-primary"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-500">
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
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
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
                {customTabs![parseInt(activeTab.key.split("-")[1])].content ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: sanitizeEmbeddedCss(customTabs![parseInt(activeTab.key.split("-")[1])].content),
                    }}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    {labels.noTabContent ?? "该系列暂无相关内容，欢迎联系我们获取选型支持"}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
    </div>
  );
}

/** 技术参数折叠组件：默认收起前部分，点击"查看更多"展开全部 */
function SpecsCollapsible({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [needCollapse, setNeedCollapse] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      const full = containerRef.current.scrollHeight;
      setNeedCollapse(full > 600);
    }
  }, [html]);

  return (
    <div className="relative">
      <style>{`
        .fotric-params .params-title { font-size:16px; font-weight:600; color:#0f172a; margin:16px 0 8px; padding-left:8px; border-left:3px solid var(--primary); }
        .fotric-params .params-row { display:grid; grid-template-columns:180px 1fr; border-bottom:1px solid #e2e8f0; padding:10px 12px; align-items:start; }
        .fotric-params .params-name { color:#64748b; font-size:14px; line-height:1.6; }
        .fotric-params .params-value { color:#0f172a; font-size:14px; line-height:1.6; font-family: var(--font-geist-mono), ui-monospace, monospace; }
      `}</style>
      <div
        ref={containerRef}
        className="fotric-params rich-text overflow-x-auto transition-all duration-500"
        style={!expanded && needCollapse ? { maxHeight: 300, overflow: "hidden", maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)" } : {}}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {needCollapse && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full rounded-md border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-primary hover:text-primary"
        >
          {expanded ? "收起 ▲" : "查看更多参数 ▼"}
        </button>
      )}
    </div>
  );
}
