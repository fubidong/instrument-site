"use client";

import { useActionState, useEffect, useState } from "react";
import { saveSupportArticleAction, type SupportArticleFormState } from "./actions";
import RichTextEditor from "@/components/rich-text-editor";

const initialState: SupportArticleFormState = {};

const TYPE_OPTIONS = [
  { value: "solution", label: "解决方案 (Solution)" },
  { value: "tech", label: "技术文章 (Technical)" },
  { value: "faq", label: "常见问题 (FAQ)" },
];

export type ArticlePdfRow = { pdfAssetId: string; pdfMode: string };
export type ArticleProductRow = { model: string };

export type SupportArticleFormData = {
  id: string;
  type: string;
  brandId: string | null;
  coverImage: string | null;
  sourceUrl: string | null;
  pdfLinks: ArticlePdfRow[];
  productLinks: ArticleProductRow[];
  isPublished: boolean;
  publishedAt: string;
  sortOrder: number;
  zhTitle: string;
  zhSummary: string;
  zhContent: string;
  enTitle: string;
  enSummary: string;
  enContent: string;
};

export default function SupportArticleForm({
  article,
  brands,
  pdfAssets,
  products,
}: {
  article: SupportArticleFormData | null;
  brands: { id: string; zhName: string; enName: string }[];
  pdfAssets: { id: string; filename: string; path: string }[];
  products: { model: string; brandName: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveSupportArticleAction, initialState);
  const [lang, setLang] = useState<"zh" | "en">("zh");

  // 多选状态：PDF 行（素材 + 模式）、商品行（型号）
  const [pdfRows, setPdfRows] = useState<ArticlePdfRow[]>(article?.pdfLinks ?? []);
  const [productRows, setProductRows] = useState<ArticleProductRow[]>(article?.productLinks ?? []);

  useEffect(() => {
    if (state.redirect) window.location.href = state.redirect;
  }, [state.redirect]);

  const tabBase = "rounded-md px-4 py-1.5 text-sm font-medium transition-colors";
  const tabActive = "bg-sky-600 text-white";
  const tabIdle = "bg-slate-100 text-slate-600 hover:bg-slate-200";

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      <input type="hidden" name="id" value={article?.id ?? ""} />
      {/* 多选数据：序列化为 JSON 提交 */}
      <input type="hidden" name="pdfLinks" value={JSON.stringify(pdfRows.filter((r) => r.pdfAssetId))} />
      <input type="hidden" name="productModels" value={JSON.stringify(productRows.map((r) => r.model).filter((m) => m.trim()))} />

      {state.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
          {state.success}
        </div>
      )}

      {/* 基本信息 */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">基本信息</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">文章类型</label>
            <select
              name="type"
              defaultValue={article?.type ?? "tech"}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">关联品牌</label>
            <select
              name="brandId"
              defaultValue={article?.brandId ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              <option value="">不关联（通用）</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.zhName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">排序（越小越靠前）</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={article?.sortOrder ?? 0}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">发布时间</label>
            <input
              name="publishedAt"
              type="datetime-local"
              defaultValue={article?.publishedAt ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">原文链接（可选）</label>
            <input
              name="sourceUrl"
              defaultValue={article?.sourceUrl ?? ""}
              placeholder="https://..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isPublished"
                defaultChecked={article?.isPublished ?? false}
                className="h-4 w-4 rounded border-slate-300"
              />
              立即发布
            </label>
          </div>
        </div>
      </section>

      {/* PDF 资料 + 关联商品（多选动态行） */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">PDF 资料 & 关联商品（支持多选）</h2>

        {/* PDF 多选 */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">关联 PDF（素材库，可加多个）</label>
            <button
              type="button"
              onClick={() => setPdfRows([...pdfRows, { pdfAssetId: "", pdfMode: "download" }])}
              className="rounded-md border border-sky-300 px-3 py-1 text-xs text-sky-600 hover:bg-sky-50"
            >
              + 添加 PDF
            </button>
          </div>
          {pdfRows.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
              暂无关联 PDF
            </p>
          )}
          <div className="space-y-2">
            {pdfRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={row.pdfAssetId}
                  onChange={(e) => {
                    const next = [...pdfRows];
                    next[idx] = { ...next[idx], pdfAssetId: e.target.value };
                    setPdfRows(next);
                  }}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">请选择素材库中的 PDF</option>
                  {pdfAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.filename}
                    </option>
                  ))}
                </select>
                <select
                  value={row.pdfMode}
                  onChange={(e) => {
                    const next = [...pdfRows];
                    next[idx] = { ...next[idx], pdfMode: e.target.value };
                    setPdfRows(next);
                  }}
                  className="w-36 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                >
                  <option value="download">直接下载</option>
                  <option value="lead">获客模式</option>
                </select>
                <button
                  type="button"
                  onClick={() => setPdfRows(pdfRows.filter((_, i) => i !== idx))}
                  className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50"
                  title="删除此行"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            直接下载：访客点击直接下载 PDF；获客模式：跳转询价表单搜集线索后获取。
          </p>
        </div>

        {/* 商品多选 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">关联商品（输入型号，可加多个）</label>
            <button
              type="button"
              onClick={() => setProductRows([...productRows, { model: "" }])}
              className="rounded-md border border-sky-300 px-3 py-1 text-xs text-sky-600 hover:bg-sky-50"
            >
              + 添加商品
            </button>
          </div>
          {productRows.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
              暂无关联商品
            </p>
          )}
          <div className="space-y-2">
            {productRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  list="support-product-list"
                  value={row.model}
                  onChange={(e) => {
                    const next = [...productRows];
                    next[idx] = { model: e.target.value };
                    setProductRows(next);
                  }}
                  placeholder="输入型号关键字，如 IT6000C / UT139C"
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setProductRows(productRows.filter((_, i) => i !== idx))}
                  className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50"
                  title="删除此行"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <datalist id="support-product-list">
            {products.map((p) => (
              <option key={p.model} value={p.model}>
                {p.brandName}
              </option>
            ))}
          </datalist>
        </div>
      </section>

      {/* 中英文 TAB 合并 */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700">文章内容</h2>
          <div className="ml-2 flex gap-1">
            <button
              type="button"
              onClick={() => setLang("zh")}
              className={`${tabBase} ${lang === "zh" ? tabActive : tabIdle}`}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`${tabBase} ${lang === "en" ? tabActive : tabIdle}`}
            >
              English
            </button>
          </div>
        </div>

        {lang === "zh" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                中文标题 <span className="text-red-500">*</span>
              </label>
              <input
                name="zhTitle"
                defaultValue={article?.zhTitle ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                placeholder="如 示波器探头选型指南"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">中文摘要</label>
              <textarea
                name="zhSummary"
                rows={2}
                defaultValue={article?.zhSummary ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                placeholder="一句话概述（列表页展示）"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">中文正文</label>
              <RichTextEditor name="zhContent" defaultValue={article?.zhContent ?? ""} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                English Title <span className="text-red-500">*</span>
              </label>
              <input
                name="enTitle"
                defaultValue={article?.enTitle ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                placeholder="e.g. Oscilloscope Probe Selection Guide"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">English Summary</label>
              <textarea
                name="enSummary"
                rows={2}
                defaultValue={article?.enSummary ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                placeholder="One-line summary (shown on list)"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">English Body</label>
              <RichTextEditor name="enContent" defaultValue={article?.enContent ?? ""} />
            </div>
          </div>
        )}
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存文章"}
        </button>
      </div>
    </form>
  );
}
