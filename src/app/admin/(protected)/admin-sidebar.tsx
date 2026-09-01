"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: string };

export default function AdminSidebar({ navItems }: { navItems: NavItem[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (localStorage.getItem("admin-sidebar-collapsed") === "1") setCollapsed(true);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("admin-sidebar-collapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside
      className={`flex shrink-0 flex-col bg-slate-900 text-slate-300 transition-all duration-200 ${
        collapsed ? "w-14" : "w-48"
      }`}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 pr-2 pl-3">
        {collapsed ? (
          <span className="mx-auto text-base font-bold text-white">仪</span>
        ) : (
          <span className="whitespace-nowrap text-sm font-bold text-white">仪器站点后台</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white ${
            collapsed ? "absolute left-3.5" : ""
          }`}
          title={collapsed ? "展开菜单" : "折叠菜单"}
        >
          {collapsed ? "▸" : "◂"}
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-1.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition hover:bg-slate-800 hover:text-white ${
              isActive(item.href) ? "bg-slate-800 text-white" : ""
            } ${collapsed ? "justify-center px-0" : ""}`}
          >
            <span className="w-5 shrink-0 text-center text-base leading-none">{item.icon}</span>
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
