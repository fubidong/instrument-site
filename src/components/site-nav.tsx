"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import type { NavNode } from "@/lib/nav";

/** 站点导航节点（server 端已预计算好 href，可安全跨边界传入 client 组件） */
export type SiteNavNode = NavNode & { href: string };

/**
 * 前台导航条项（由 NavMenu 数据驱动，综合站/品牌站共用）
 * nodes: 调用方（server）已为每个节点预算好 href 字符串；外链节点 href 即外部 URL。
 *
 * 本组件只渲染导航项，外层 <nav> 由调用方提供，保证综合站与品牌站两处布局一致。
 * 当前项高亮：通过 usePathname（next-intl，不含 locale 前缀）与节点 path 比对。
 * 含子菜单的项由「链接 + 按钮触发器」组成，按钮带 aria-haspopup / aria-expanded；
 * 面板同时支持 :hover（鼠标）与 :focus-within（键盘 Tab）展开，chevron 随开合旋转。
 */
export default function SiteNav({
  nodes,
  isEn,
}: {
  nodes: SiteNavNode[];
  isEn: boolean;
}) {
  const label = (n: SiteNavNode) => (isEn ? n.enName || n.name : n.name || n.enName);
  const visible = nodes.filter((n) => n.isVisible);
  const pathname = usePathname();

  const isActive = (n: SiteNavNode) => {
    if (n.isExternal) return false;
    if (n.path === "/") return pathname === "/";
    return pathname === n.path || pathname.startsWith(n.path + "/");
  };

  const itemBase =
    "relative whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
  const idle = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  const active = "text-primary";

  return (
    <>
      {visible.map((n) => {
        const children = n.children.filter((c) => c.isVisible) as SiteNavNode[];
        const activeNow = isActive(n);

        if (n.isExternal) {
          return (
            <a
              key={n.id}
              href={n.href}
              target={n.target || "_self"}
              rel="noopener"
              className={`${itemBase} ${idle}`}
            >
              {label(n)}
            </a>
          );
        }

        if (children.length === 0) {
          return (
            <Link
              key={n.id}
              href={n.href}
              aria-current={activeNow ? "page" : undefined}
              className={`${itemBase} ${activeNow ? active : idle}`}
            >
              {label(n)}
              {activeNow && (
                <span
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        }

        return (
          <div key={n.id} className="group relative">
            <div className="flex items-center">
              <Link
                href={n.href}
                aria-current={activeNow ? "page" : undefined}
                className={`${itemBase} ${activeNow ? active : idle} rounded-r-none`}
              >
                {label(n)}
                {activeNow && (
                  <span
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
              </Link>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded="false"
                aria-label={`${label(n)} submenu`}
                className="rounded-r-md px-1.5 py-2 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <ChevronDown
                  width={14}
                  height={14}
                  aria-hidden="true"
                  className="transition-transform duration-150 group-focus-within:rotate-180 group-hover:rotate-180"
                />
              </button>
            </div>
            <div className="invisible absolute left-0 top-full z-50 mt-1 max-h-[70vh] w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              {children.map((c) => (
                <NavDropdownNode key={c.id} node={c} label={label} depth={0} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

function NavDropdownNode({
  node,
  label,
  depth,
}: {
  node: SiteNavNode;
  label: (n: SiteNavNode) => string;
  depth: number;
}) {
  const children = node.children.filter((c) => c.isVisible) as SiteNavNode[];
  if (node.isExternal) {
    return (
      <a
        href={node.href}
        target={node.target || "_self"}
        rel="noopener"
        className="block whitespace-nowrap rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary"
      >
        {label(node)}
      </a>
    );
  }
  if (children.length === 0) {
    return (
      <Link
        href={node.href}
        className="block whitespace-nowrap rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary"
      >
        {label(node)}
      </Link>
    );
  }
  return (
    <div>
      <Link
        href={node.href}
        className="flex items-center justify-between whitespace-nowrap rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary"
      >
        {label(node)}
        <ChevronDown width={12} height={12} className="rotate-[-90deg] text-slate-400" aria-hidden="true" />
      </Link>
      <div className="ml-3 border-l border-slate-200 pl-2" style={{ marginTop: depth === 0 ? 0 : undefined }}>
        {children.map((c) => (
          <NavDropdownNode key={c.id} node={c} label={label} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}
