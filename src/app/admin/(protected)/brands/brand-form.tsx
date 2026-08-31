"use client";

import { useActionState, useEffect, useState } from "react";
import FileUpload from "@/components/admin/file-upload";
import { saveBrandAction, type BrandFormState } from "./actions";

const initialState: BrandFormState = {};

export default function BrandForm({
  brand,
}: {
  brand: {
    id: string;
    code: string;
    logo: string | null;
    website: string | null;
    sortOrder: number;
    isActive: boolean;
    translations: {
      locale: string;
      name: string;
      description: string | null;
      fullDescription: string | null;
    }[];
  } | null;
}) {
  const [state, formAction, pending] = useActionState(saveBrandAction, initialState);
  const [logo, setLogo] = useState(brand?.logo ?? "");

  // 创建成功后跳转
  useEffect(() => {
    if (state.redirect) {
      window.location.href = state.redirect;
    }
  }, [state.redirect]);

  const t = Object.fromEntries(
    (brand?.translations ?? []).map((tr) => [tr.locale, tr])
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <input type="hidden" name="id" value={brand?.id ?? ""} />
      <input type="hidden" name="logo" value={logo} />
      {/* 编辑时 code 输入框只读，用 hidden 字段携带原值 */}
      {brand && <input type="hidden" name="code" value={brand.code} />}

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

      {/* 基础信息 */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">基础信息</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              品牌代码 <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              defaultValue={brand?.code ?? ""}
              required
              disabled={!!brand}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-50"
              placeholder="如 SIGLENT"
            />
            <p className="mt-1 text-xs text-slate-400">创建后不可修改，用于品牌唯一标识</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              品牌官网
            </label>
            <input
              name="website"
              defaultValue={brand?.website ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="https://www.siglent.com/"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">排序</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={brand?.sortOrder ?? 0}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Logo</label>
            <FileUpload kind="image" value={logo} onChange={setLogo} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              状态
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={brand?.isActive ?? true}
                className="h-4 w-4 rounded border-slate-300"
              />
              启用（停用后前台不展示）
            </label>
          </div>
        </div>
      </section>

      {/* 中文 */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">中文内容</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              品牌名称（中文）<span className="text-red-500">*</span>
            </label>
            <input
              name="name_zh"
              defaultValue={t["zh"]?.name ?? ""}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="如 鼎阳"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">简介（中文）</label>
            <textarea
              name="desc_zh"
              defaultValue={t["zh"]?.description ?? ""}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">详细介绍（中文）</label>
            <textarea
              name="fullDesc_zh"
              defaultValue={t["zh"]?.fullDescription ?? ""}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </section>

      {/* 英文 */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">English Content</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Brand Name (EN) <span className="text-red-500">*</span>
            </label>
            <input
              name="name_en"
              defaultValue={t["en"]?.name ?? ""}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="e.g. SIGLENT"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description (EN)</label>
            <textarea
              name="desc_en"
              defaultValue={t["en"]?.description ?? ""}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Description (EN)</label>
            <textarea
              name="fullDesc_en"
              defaultValue={t["en"]?.fullDescription ?? ""}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存品牌"}
        </button>
      </div>
    </form>
  );
}
