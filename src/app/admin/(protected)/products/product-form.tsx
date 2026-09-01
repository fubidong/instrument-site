"use client";

import { useActionState, useEffect } from "react";
import { saveProductAction, type ProductFormState } from "./actions";
import ProductParamsForm, { type ParamGroupWithDefs } from "./product-params-form";
import RichTextEditor from "@/components/rich-text-editor";

const initialState: ProductFormState = {};

export default function ProductForm({
  product,
  lines,
  paramGroups,
  paramValues,
  initialProductLineId,
}: {
  product: {
    id: string;
    productLineId: string;
    model: string;
    sku: string | null;
    coverImage: string | null;
    sortOrder: number;
    isActive: boolean;
    isFeatured: boolean;
    isSampleEnabled: boolean;
    translations: { locale: string; name: string; summary: string | null; description: string | null }[];
  } | null;
  lines: { id: string; code: string; zhName: string; enName: string; brandZh: string; categoryZh: string }[];
  paramGroups: ParamGroupWithDefs[];
  paramValues: Record<string, any>;
  initialProductLineId?: string;
}) {
  const [state, formAction, pending] = useActionState(saveProductAction, initialState);

  useEffect(() => {
    if (state.redirect) window.location.href = state.redirect;
  }, [state.redirect]);

  const t = Object.fromEntries((product?.translations ?? []).map((tr) => [tr.locale, tr]));
  const selectedLine = lines.find((l) => l.id === (product?.productLineId ?? initialProductLineId));

  return (
    <form action={formAction} className="max-w-5xl space-y-6">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      {product && <input type="hidden" name="model" value={product.model} />}
      {product && <input type="hidden" name="productLineId" value={product.productLineId} />}

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

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">基础信息</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              所属系列 <span className="text-red-500">*</span>
            </label>
            {product ? (
              <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {selectedLine
                  ? `${selectedLine.brandZh} / ${selectedLine.categoryZh} / ${selectedLine.zhName} (${selectedLine.code})`
                  : "未知系列"}
              </div>
            ) : (
              <select
                name="productLineId"
                defaultValue={initialProductLineId ?? ""}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="">选择系列（自动带出品牌/类别）</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.brandZh} / {l.categoryZh} / {l.zhName} ({l.code})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              型号 <span className="text-red-500">*</span>
            </label>
            <input
              name="model"
              defaultValue={product?.model ?? ""}
              required
              disabled={!!product}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-50"
              placeholder="如 SDS1104X-E"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">SKU</label>
            <input
              name="sku"
              defaultValue={product?.sku ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">排序</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={product?.sortOrder ?? 0}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex items-end gap-6 pb-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={product?.isActive ?? true}
                className="h-4 w-4 rounded border-slate-300"
              />
              启用
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={product?.isFeatured ?? false}
                className="h-4 w-4 rounded border-slate-300"
              />
              推荐（首页展示）
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700" title="开启后前台详情页显示“申请样机”按钮">
              <input
                type="checkbox"
                name="isSampleEnabled"
                defaultChecked={product?.isSampleEnabled ?? false}
                className="h-4 w-4 rounded border-slate-300"
              />
              申请样机
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">封面图</label>
            <input
              name="coverImage"
              defaultValue={product?.coverImage ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="/uploads/images/202608/xxx.jpg"
            />
            {product?.coverImage && (
              <img
                src={product.coverImage}
                alt="cover"
                className="mt-2 h-20 w-20 rounded-md border object-cover"
              />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">中文内容</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              产品名称（中文）<span className="text-red-500">*</span>
            </label>
            <input
              name="name_zh"
              defaultValue={t["zh"]?.name ?? ""}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              简介（中文）<span className="ml-1 text-xs font-normal text-slate-400">显示在主图右侧</span>
            </label>
            <textarea
              name="summary_zh"
              defaultValue={t["zh"]?.summary ?? ""}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              产品介绍（中文）<span className="ml-1 text-xs font-normal text-slate-400">“产品介绍”选项卡内容，与简介分开</span>
            </label>
            <RichTextEditor name="description_zh" defaultValue={t["zh"]?.description ?? ""} minHeight={220} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">English Content</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Product Name (EN) <span className="text-red-500">*</span>
            </label>
            <input
              name="name_en"
              defaultValue={t["en"]?.name ?? ""}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Summary (EN) <span className="ml-1 text-xs font-normal text-slate-400">shown next to main image</span>
            </label>
            <textarea
              name="summary_en"
              defaultValue={t["en"]?.summary ?? ""}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description (EN) <span className="ml-1 text-xs font-normal text-slate-400">Overview tab content, separate from summary</span>
            </label>
            <RichTextEditor name="description_en" defaultValue={t["en"]?.description ?? ""} minHeight={220} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">
            产品参数 <span className="ml-1 text-xs font-normal text-slate-400">按类别模板自动渲染</span>
          </h2>
        </div>
        <div className="p-5">
          <ProductParamsForm groups={paramGroups} values={paramValues} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存产品"}
        </button>
      </div>
    </form>
  );
}
