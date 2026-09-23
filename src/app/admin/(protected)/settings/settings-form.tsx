"use client";

import { useActionState } from "react";
import { saveSettingsAction, type SettingsFormState } from "./actions";

const initialState: SettingsFormState = {};

export default function SettingsForm({
  initial,
}: {
  initial: {
    siteNameZh: string;
    siteNameEn: string;
    phone: string;
    phoneEnabled: boolean;
    email: string;
    address: string;
    introZh: string;
    introEn: string;
    logo: string;
    favicon: string;
    footerZh: string;
    footerEn: string;
  };
}) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, initialState);

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
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
        <h2 className="mb-4 text-sm font-semibold text-slate-700">站点名称</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">站点名称（中文）</label>
            <input
              name="site_name_zh"
              defaultValue={initial.siteNameZh}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="仪器仪表站"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">站点名称（英文）</label>
            <input
              name="site_name_en"
              defaultValue={initial.siteNameEn}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="Test & Measurement"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          联系方式 <span className="ml-1 text-xs font-normal text-slate-400">前台产品详情页显著展示</span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">联系电话</label>
            <input
              name="contact_phone"
              defaultValue={initial.phone}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="0755-8888 8888"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="contact_phone_enabled"
                defaultChecked={initial.phoneEnabled}
                className="h-4 w-4 rounded border-slate-300"
              />
              产品详情页右侧显示"咨询热线"
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">联系邮箱</label>
            <input
              name="contact_email"
              type="email"
              defaultValue={initial.email}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="sales@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">公司地址</label>
            <input
              name="contact_address"
              defaultValue={initial.address}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="深圳市南山区..."
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">公司简介</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">简介（中文）</label>
            <textarea
              name="company_intro_zh"
              defaultValue={initial.introZh}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">简介（英文）</label>
            <textarea
              name="company_intro_en"
              defaultValue={initial.introEn}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Logo 与站标</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">站点 Logo 图片 URL</label>
            <input name="site_logo" defaultValue={initial.logo} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="/uploads/logo.png" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">站标 / Favicon URL</label>
            <input name="site_favicon" defaultValue={initial.favicon} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="/favicon.ico" />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">首页页底</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">页底文字（中文）</label>
            <textarea name="footer_text_zh" defaultValue={initial.footerZh} rows={3} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">页底文字（英文）</label>
            <textarea name="footer_text_en" defaultValue={initial.footerEn} rows={3} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存设置"}
      </button>
    </form>
  );
}
