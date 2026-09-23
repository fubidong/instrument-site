"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { submitInquiryAction, type InquiryState } from "./actions";

const initialState: InquiryState = {};

const inputClass =
  "w-full rounded-md border border-[var(--ui-line)] bg-white px-3 py-2.5 text-sm text-[var(--ui-ink)] placeholder:text-[var(--ui-mute)] outline-none transition-colors duration-200 hover:border-[var(--ui-mute)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const labelClass =
  "mb-1.5 block text-xs font-medium tracking-wide text-[var(--ui-ink)]";

export default function InquiryForm({
  locale = "zh",
  productId,
  productModel,
  productName,
  initialMessage,
}: {
  locale?: string;
  productId?: string;
  productModel?: string;
  productName?: string;
  initialMessage?: string;
}) {
  const isEn = locale === "en";
  const [state, formAction, pending] = useActionState(submitInquiryAction, initialState);
  const [showSuccess, setShowSuccess] = useState(false);

  const L = {
    eyebrow: isEn ? "Request a quote" : "提交询价",
    title: isEn ? "Inquiry form" : "询价表单",
    subtitle: isEn
      ? "Tell us what you're looking for and we'll get back to you."
      : "留下您的需求，我们将尽快与您联系。",
    groupContact: isEn ? "Your details" : "联系信息",
    groupNeed: isEn ? "Your inquiry" : "需求描述",
    product: isEn ? "Product of interest" : "咨询产品",
    name: isEn ? "Your name" : "您的姓名 / 称呼",
    company: isEn ? "Company" : "公司名称",
    contact: isEn ? "Contact (phone/WeChat)" : "联系方式（电话/微信）",
    email: isEn ? "Email" : "邮箱",
    message: isEn ? "Describe your needs (model, quantity, application...)" : "请描述您的需求（型号、数量、用途等）",
    optional: isEn ? "Optional" : "选填",
    required: isEn ? "Required" : "必填",
    submit: isEn ? "Submit inquiry" : "提交询价",
    submitting: isEn ? "Submitting…" : "提交中…",
    privacy: isEn
      ? "By submitting you agree to be contacted by us (business purposes only)."
      : "提交即表示同意我们与您联系（仅用于业务沟通）。",
    success: isEn ? "Your inquiry has been submitted. We will contact you soon!" : "询价已提交，我们会尽快与您联系！",
    again: isEn ? "Submit another" : "再次询价",
  };

  useEffect(() => {
    if (state.success) {
      if (state.redirect) {
        window.location.href = state.redirect;
        return;
      }
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.success, state.redirect]);

  if (showSuccess) {
    return (
      <div className="ui-card ui-card-pad">
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ui-trust)]/30 bg-[var(--ui-trust-soft)] text-[var(--ui-trust)]">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div className="mt-4 text-base font-semibold text-[var(--ui-ink)]">{state.success}</div>
          <button
            type="button"
            onClick={() => {
              setShowSuccess(false);
              window.location.reload();
            }}
            className="ui-btn-ghost mt-6"
          >
            {L.again}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="ui-card ui-card-pad">
      <header>
        <p className="ui-eyebrow">{L.eyebrow}</p>
        <h2 className="ui-h3 mt-2">{L.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--ui-mute)]">{L.subtitle}</p>
      </header>

      {productId && <input type="hidden" name="productId" value={productId} />}

      {state.error && (
        <div
          role="alert"
          className="mt-5 rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {state.error}
        </div>
      )}

      <div className="mt-6 space-y-7">
        {/* Group: contact details */}
        <fieldset className="space-y-4">
          <legend className="sr-only">{L.groupContact}</legend>
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ui-mute)]">
              {L.groupContact}
            </h3>
            <span className="h-px flex-1 bg-[var(--ui-line)]" />
          </div>

          {productName && (
            <div className="rounded-md border border-[var(--ui-line)] bg-[var(--ui-sunken)] px-3 py-2.5 text-sm text-[var(--ui-ink)]">
              <span className="text-[var(--ui-mute)]">{L.product}：</span>
              <span className="ui-num">{productName}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="inquiry-name" className={labelClass}>
                {L.name} <span className="text-red-500">*</span>
              </label>
              <input id="inquiry-name" name="name" required className={inputClass} placeholder={L.name} />
            </div>
            <div>
              <label htmlFor="inquiry-contact" className={labelClass}>
                {L.contact} <span className="text-red-500">*</span>
              </label>
              <input id="inquiry-contact" name="contact" required className={inputClass} placeholder={L.contact} />
            </div>
            <div>
              <label htmlFor="inquiry-company" className={labelClass}>
                {L.company}{" "}
                <span className="font-normal text-[var(--ui-mute)]">({L.optional})</span>
              </label>
              <input id="inquiry-company" name="company" className={inputClass} placeholder={L.company} />
            </div>
            <div>
              <label htmlFor="inquiry-email" className={labelClass}>
                {L.email}{" "}
                <span className="font-normal text-[var(--ui-mute)]">({L.optional})</span>
              </label>
              <input id="inquiry-email" type="email" name="email" className={inputClass} placeholder={L.email} />
            </div>
          </div>
        </fieldset>

        {/* Group: inquiry */}
        <fieldset className="space-y-4">
          <legend className="sr-only">{L.groupNeed}</legend>
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ui-mute)]">
              {L.groupNeed}
            </h3>
            <span className="h-px flex-1 bg-[var(--ui-line)]" />
          </div>
          <div>
            <label htmlFor="inquiry-message" className={labelClass}>
              {L.message}
            </label>
            <textarea
              id="inquiry-message"
              name="message"
              rows={5}
              defaultValue={initialMessage ?? ""}
              className={`${inputClass} resize-y`}
              placeholder={L.message}
            />
          </div>
        </fieldset>

        <div className="space-y-3">
          <button type="submit" disabled={pending} className="ui-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? L.submitting : L.submit}
          </button>
          <p className="text-center text-xs leading-relaxed text-[var(--ui-mute)]">{L.privacy}</p>
        </div>
      </div>
    </form>
  );
}
