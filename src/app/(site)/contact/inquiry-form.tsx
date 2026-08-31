"use client";

import { useActionState, useEffect, useState } from "react";
import { submitInquiryAction, type InquiryState } from "./actions";

const initialState: InquiryState = {};

export default function InquiryForm({
  productId,
  productModel,
  productName,
}: {
  productId?: string;
  productModel?: string;
  productName?: string;
}) {
  const [state, formAction, pending] = useActionState(submitInquiryAction, initialState);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.success]);

  if (showSuccess) {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center">
        <div className="text-2xl">✓</div>
        <div className="mt-2 text-sm font-semibold text-green-700">{state.success}</div>
        <button
          type="button"
          onClick={() => {
            setShowSuccess(false);
            window.location.reload();
          }}
          className="mt-4 rounded-md border border-green-400 px-4 py-2 text-sm text-green-700 hover:bg-green-100"
        >
          再次询价
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-3 text-base font-semibold text-slate-800">获取报价</div>
      {productId && <input type="hidden" name="productId" value={productId} />}

      {state.error && (
        <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="space-y-3">
        {productName && (
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            咨询产品：{productName}
          </div>
        )}
        <div>
          <input
            name="name"
            placeholder="您的姓名 / 称呼 *"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <input
            name="company"
            placeholder="公司名称（选填）"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <input
            name="contact"
            placeholder="联系方式（电话/微信）*"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <input
            name="email"
            type="email"
            placeholder="邮箱（选填）"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <textarea
            name="message"
            rows={3}
            placeholder="请描述您的需求（型号、数量、用途等）"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {pending ? "提交中..." : "提交询价"}
        </button>
        <p className="text-center text-xs text-slate-400">
          提交即表示同意我们与您联系（仅用于业务沟通）
        </p>
      </div>
    </form>
  );
}
