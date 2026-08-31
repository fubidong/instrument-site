"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  updateInquiryStatusAction,
  updateInquiryNoteAction,
  batchDeleteInquiriesAction,
  type InquiryActionState,
} from "./actions";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "待处理", cls: "bg-amber-100 text-amber-700" },
  quoted: { label: "已报价", cls: "bg-sky-100 text-sky-700" },
  closed_won: { label: "已成交", cls: "bg-green-100 text-green-700" },
  closed_lost: { label: "已关闭", cls: "bg-slate-100 text-slate-500" },
};

type InquiryRow = {
  id: string;
  name: string;
  company: string | null;
  contact: string;
  email: string | null;
  country: string | null;
  message: string;
  status: string;
  adminNote: string | null;
  sourceIp: string | null;
  createdAt: string;
  product: { model: string } | null;
};

export default function InquiriesClient({ rows }: { rows: InquiryRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [searchText, setSearchText] = useState(searchParams.get("q") ?? "");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") ?? "";
  const q = searchParams.get("q") ?? "";

  function apply(status: string, query: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    router.push(`/admin/inquiries${params.toString() ? `?${params.toString()}` : ""}`);
  }

  async function runAction(action: (prev: InquiryActionState, fd: FormData) => Promise<InquiryActionState>, payload: Record<string, string>) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.set(k, v));
    startTransition(async () => {
      const res = await action({}, fd);
      if (res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: res.success ?? "操作成功" });
      router.refresh();
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }
  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <div className="space-y-4">
      {/* 操作提示 */}
      {msg && (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            msg.type === "ok"
              ? "border-green-400/40 bg-green-50 text-green-700"
              : "border-red-400/40 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
        {[
          { v: "", label: "全部" },
          { v: "pending", label: "待处理" },
          { v: "quoted", label: "已报价" },
          { v: "closed_won", label: "已成交" },
          { v: "closed_lost", label: "已关闭" },
        ].map((s) => (
          <button
            key={s.v}
            type="button"
            onClick={() => apply(s.v, q)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              currentStatus === s.v
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply(currentStatus, searchText)}
          placeholder="搜索姓名/公司/联系方式..."
          className="ml-auto w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        />
      </div>

      {/* 批量操作 */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm">
          <span className="font-medium text-sky-700">已选 {selected.size} 条</span>
          <button
            type="button"
            onClick={() => runAction(batchDeleteInquiriesAction, { ids: [...selected].join(",") })}
            className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-500"
          >
            批量删除
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="text-slate-500 hover:text-slate-700">
            取消选择
          </button>
        </div>
      )}

      {/* 列表 */}
      <div className="space-y-3">
        {rows.map((r) => {
          const st = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
          const expanded = editingNote === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-start gap-3 p-4">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  className="mt-1 h-4 w-4"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">{r.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${st.cls}`}>{st.label}</span>
                    {r.company && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {r.company}
                      </span>
                    )}
                    {r.product && (
                      <span className="rounded bg-sky-50 px-2 py-0.5 font-mono text-xs text-sky-700">
                        {r.product.model}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span>📞 {r.contact}</span>
                    {r.email && <span>✉ {r.email}</span>}
                    {r.country && <span>🌍 {r.country}</span>}
                  </div>
                  <p className="mt-2 rounded bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {r.message}
                  </p>
                  {r.adminNote && (
                    <p className="mt-2 text-sm text-amber-700">
                      <span className="font-medium">备注：</span>
                      {r.adminNote}
                    </p>
                  )}
                  {r.sourceIp && <p className="mt-1 text-xs text-slate-300">IP: {r.sourceIp}</p>}
                </div>
              </div>

              {/* 操作行 */}
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2">
                <select
                  value={r.status}
                  onChange={(e) => runAction(updateInquiryStatusAction, { id: r.id, status: e.target.value })}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                >
                  <option value="pending">待处理</option>
                  <option value="quoted">已报价</option>
                  <option value="closed_won">已成交</option>
                  <option value="closed_lost">已关闭</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (expanded) {
                      setEditingNote(null);
                    } else {
                      setEditingNote(r.id);
                      setNoteText(r.adminNote ?? "");
                    }
                  }}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-white"
                >
                  {expanded ? "取消" : r.adminNote ? "编辑备注" : "添加备注"}
                </button>
                <button
                  type="button"
                  onClick={() => runAction(batchDeleteInquiriesAction, { ids: r.id })}
                  className="ml-auto rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  删除
                </button>
              </div>

              {/* 备注编辑 */}
              {expanded && (
                <div className="border-t border-slate-100 bg-amber-50/50 p-4">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={2}
                    placeholder="记录跟进情况、报价金额等..."
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => runAction(updateInquiryNoteAction, { id: r.id, adminNote: noteText })}
                      className="rounded-md bg-amber-600 px-4 py-1.5 text-sm text-white hover:bg-amber-500"
                    >
                      保存备注
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center text-slate-400">
          没有符合条件的询价线索
        </div>
      )}

      {/* 全选 */}
      {rows.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} className="h-4 w-4" />
          全选当前页（{rows.length} 条）
        </label>
      )}
    </div>
  );
}
