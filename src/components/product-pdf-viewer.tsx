"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

/**
 * 产品规格 PDF 内嵌查看器（pdf.js canvas 渲染，不触发浏览器导航/跳转）
 * 支持分页预览 + 外链下载
 */
export default function ProductPdfViewer({ src, title }: { src: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // 1. 加载 pdf.js 库（本地 public/pdfjs）
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "/pdfjs/pdf.min.js";
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";
        setPdfReady(true);
      }
    };
    script.onerror = () => setStatus("error");
    document.head.appendChild(script);
  }, []);

  // 2. 加载 PDF 文档
  useEffect(() => {
    if (!pdfReady) return;
    let cancelled = false;
    setStatus("loading");
    setPageNum(1);
    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.arrayBuffer();
      })
      .then((buf) => window.pdfjsLib.getDocument({ data: buf }).promise)
      .then((doc) => {
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [src, pdfReady]);

  // 3. 渲染当前页
  const renderPage = useCallback(async (n: number) => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!doc || !canvas || !wrap) return;
    try {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const avail = Math.max((wrap.clientWidth || 800) - 24, 320);
      const scale = Math.min(1.6, avail / base.width);
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (e) {
      // 单页渲染失败静默（保持上一页）
    }
  }, []);

  useEffect(() => {
    if (status === "ready") renderPage(pageNum);
  }, [status, pageNum, renderPage]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {status === "error" && (
        <div className="flex h-40 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-slate-400">
          <span>无法预览该 PDF，可点击下方按钮下载查看</span>
        </div>
      )}
      {status !== "error" && (
        <div
          ref={wrapRef}
          className="flex max-h-[68vh] min-h-[320px] items-start justify-center overflow-auto bg-slate-100 p-3"
        >
          {status === "loading" && (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">加载中…</div>
          )}
          {status === "ready" && (
            <canvas ref={canvasRef} className="max-w-none shadow-md" />
          )}
        </div>
      )}
      {status === "ready" && numPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-slate-100 py-2 text-sm text-slate-500">
          <button
            type="button"
            disabled={pageNum <= 1}
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            className="rounded border border-slate-200 px-2.5 py-1 transition hover:border-primary disabled:opacity-40"
          >
            上一页
          </button>
          <span>
            第 {pageNum} / {numPages} 页
          </span>
          <button
            type="button"
            disabled={pageNum >= numPages}
            onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
            className="rounded border border-slate-200 px-2.5 py-1 transition hover:border-primary disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
