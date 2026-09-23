"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, ShieldCheck, Phone } from "lucide-react";
import type { NavNode } from "@/lib/nav";

/**
 * 移动端汉堡抽屉导航（仅 <md 显示）。
 * 接收 navTree 数据与 locale，自行拼接 locale 前缀路径（与桌面 SiteNav 行为一致）。
 * phone（可选）用于抽屉底部服务热线信任信号。
 */
export default function SiteNavMobile({
  nodes,
  locale,
  isEn,
  phone,
}: {
  nodes: NavNode[];
  locale: string;
  isEn: boolean;
  phone?: string;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const label = (n: NavNode) => (isEn ? n.enName || n.name : n.name || n.enName);
  const visible = nodes.filter((n) => n.isVisible);
  const hrefFor = (n: NavNode) => `/${locale}${n.path === "/" ? "" : n.path}`;
  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const row =
    "block rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-primary";

  return (
    <>
      <button
        type="button"
        aria-label={isEn ? "Open menu" : "打开菜单"}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:hidden"
      >
        <Menu width={20} height={20} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 flex h-full w-4/5 max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <span className="text-sm font-semibold text-slate-900">{isEn ? "Menu" : "菜单"}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={isEn ? "Close menu" : "关闭菜单"}
                className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <X width={18} height={18} aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
              <Link
                href={`/${locale}/catalog`}
                onClick={() => setOpen(false)}
                className={`mb-1 ${row}`}
              >
                {isEn ? "Catalog" : "产品目录"}
              </Link>

              {visible.map((n) => {
                const children = n.children.filter((c) => c.isVisible);
                const isOpen = !!expanded[n.id];
                if (n.isExternal) {
                  return (
                    <a
                      key={n.id}
                      href={n.path}
                      target={n.target || "_self"}
                      rel="noopener"
                      className={`${row} font-normal text-slate-600`}
                    >
                      {label(n)}
                    </a>
                  );
                }
                if (children.length === 0) {
                  return (
                    <Link
                      key={n.id}
                      href={hrefFor(n)}
                      onClick={() => setOpen(false)}
                      className={row}
                    >
                      {label(n)}
                    </Link>
                  );
                }
                return (
                  <div key={n.id}>
                    <div className="flex items-center justify-between">
                      <Link
                        href={hrefFor(n)}
                        onClick={() => setOpen(false)}
                        className={`flex-1 ${row}`}
                      >
                        {label(n)}
                      </Link>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-label={`${label(n)} submenu`}
                        onClick={() => toggle(n.id)}
                        className="rounded-md p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <ChevronDown
                          width={14}
                          height={14}
                          aria-hidden="true"
                          className={`transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="ml-3 border-l border-slate-200 pl-2">
                        {children.map((c) => (
                          <MobileChild key={c.id} node={c} hrefFor={hrefFor} label={label} onNavigate={() => setOpen(false)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 px-4 py-4">
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck width={14} height={14} className="text-[var(--ui-trust)]" aria-hidden="true" />
                  <span>{isEn ? "Authorized distributor · Inquiry-based" : "授权代理 · 询价采购 · 无购物车"}</span>
                </div>
                {phone && (
                  <div className="flex items-center gap-2">
                    <Phone width={14} height={14} className="text-slate-400" aria-hidden="true" />
                    <span className="ui-num text-sm font-semibold text-slate-700">{phone}</span>
                  </div>
                )}
              </div>
              <Link
                href={`/${locale}/contact`}
                onClick={() => setOpen(false)}
                className="mt-3 block rounded-md bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                {isEn ? "Inquiry" : "在线询价"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileChild({
  node,
  hrefFor,
  label,
  onNavigate,
}: {
  node: NavNode;
  hrefFor: (n: NavNode) => string;
  label: (n: NavNode) => string;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const children = node.children.filter((c) => c.isVisible);
  if (node.isExternal) {
    return (
      <a
        href={node.path}
        target={node.target || "_self"}
        rel="noopener"
        className="block rounded-md px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
      >
        {label(node)}
      </a>
    );
  }
  if (children.length === 0) {
    return (
      <Link
        href={hrefFor(node)}
        onClick={onNavigate}
        className="block rounded-md px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
      >
        {label(node)}
      </Link>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href={hrefFor(node)}
          onClick={onNavigate}
          className="flex-1 rounded-md px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
        >
          {label(node)}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${label(node)} submenu`}
          onClick={() => setOpen(!open)}
          className="rounded-md p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ChevronDown
            width={14}
            height={14}
            aria-hidden="true"
            className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {open && (
        <div className="ml-3 border-l border-slate-200 pl-2">
          {children.map((c) => (
            <MobileChild key={c.id} node={c} hrefFor={hrefFor} label={label} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
