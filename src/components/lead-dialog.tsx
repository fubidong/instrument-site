"use client";

import { useActionState, useEffect, useState } from "react";
import { submitLeadAction, type InquiryState } from "@/app/[locale]/contact/actions";

const initialState: InquiryState = {};

/**
 * 通用线索弹窗（询价 / 申请样机）
 * type: "inquiry" | "sample"
 */
export default function LeadDialog({
  type,
  locale = "zh",
  productId,
  productModel,
  productName,
  buttonClassName,
}: {
  type: "inquiry" | "sample";
  locale?: string;
  productId?: string;
  productModel?: string;
  productName?: string;
  buttonClassName?: string;
}) {
  const isEn = locale === "en";
  const isSample = type === "sample";
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(submitLeadAction, initialState);
  const [done, setDone] = useState(false);

  const L = {
    quote: isEn ? "Get a Quote" : "获取报价",
    sample: isEn ? "Request a Sample" : "申请样机",
    title: isEn ? (isSample ? "Request a Sample" : "Get a Quote") : isSample ? "申请样机" : "获取报价",
    product: isEn ? "Product" : "咨询产品",
    name: isEn ? "Your Name" : "您的姓名",
    company: isEn ? "Company (optional)" : "公司名称（选填）",
    contact: isEn ? "Contact (phone/WeChat)" : "联系方式（电话/微信）",
    email: isEn ? "Email (optional)" : "邮箱（选填）",
    message: isEn
      ? isSample
        ? "Describe your needs (model, quantity, application...)"
        : "Describe your needs (model, quantity, application...)"
      : isSample
        ? "请描述样机需求（型号、用途、数量等）"
        : "请描述您的需求（型号、数量、用途等）",
    submit: isEn ? (isSample ? "Submit Request" : "Submit Inquiry") : isSample ? "提交申请" : "提交询价",
    submitting: isEn ? "Submitting..." : "提交中...",
    privacy: isEn
      ? "By submitting you agree to be contacted by us (business purposes only)"
      : "提交即表示同意我们与您联系（仅用于业务沟通）",
    success: isEn
      ? isSample
        ? "Your sample request has been submitted. We will contact you soon!"
        : "Your inquiry has been submitted. We will contact you soon!"
      : isSample
        ? "样机申请已提交，我们会尽快与您联系！"
        : "询价已提交，我们会尽快与您联系！",
    close: isEn ? "Close" : "关闭",
    sending: isEn ? "Sending..." : "发送中...",
  };

  useEffect(() => {
    if (state.success) setDone(true);
  }, [state.success]);

  const reset = () => {
    setOpen(false);
    setDone(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          buttonClassName ??
          (isSample
            ? "rounded-md border border-sky-300 px-5 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            : "rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500")
        }
      >
        {isSample ? L.sample : L.quote}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{L.title}</h3>
              <button type="button" onClick={reset} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {done ? (
              <div className="py-8 text-center">
                <div className="text-3xl text-green-500">✓</div>
                <div className="mt-3 text-sm font-medium text-slate-700">{L.success}</div>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  {L.close}
                </button>
              </div>
            ) : (
              <form action={formAction} className="space-y-3">
                <input type="hidden" name="type" value={type} />
                {productId && <input type="hidden" name="productId" value={productId} />}
                {productModel && <input type="hidden" name="productModel" value={productModel} />}

                {state.error && (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                    {state.error}
                  </div>
                )}

                {productName && (
                  <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {L.product}：{productName}
                  </div>
                )}

                <div>
                  <input
                    name="name"
                    placeholder={`${L.name} *`}
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <input
                    name="company"
                    placeholder={L.company}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <input
                    name="contact"
                    placeholder={`${L.contact} *`}
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <input
                    name="email"
                    type="email"
                    placeholder={L.email}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder={L.message}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-md bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                >
                  {pending ? L.submitting : L.submit}
                </button>
                <p className="text-center text-xs text-slate-400">{L.privacy}</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
