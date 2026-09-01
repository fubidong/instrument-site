import Link from "next/link";
import type { NavNode } from "@/lib/nav";

/**
 * 前台导航条（由 NavMenu 数据驱动，综合站/品牌站共用）
 * hrefFor: 根据菜单节点生成最终链接（含 locale / 品牌前缀）
 */
export default function SiteNav({
  nodes,
  hrefFor,
  isEn,
}: {
  nodes: NavNode[];
  hrefFor: (n: NavNode) => string;
  isEn: boolean;
}) {
  const label = (n: NavNode) => (isEn ? n.enName || n.name : n.name || n.enName);
  const visible = nodes.filter((n) => n.isVisible);

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {visible.map((n) => {
        const children = n.children.filter((c) => c.isVisible);
        if (n.isExternal) {
          return (
            <a
              key={n.id}
              href={n.path}
              target={n.target || "_self"}
              rel="noopener"
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
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
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {label(n)}
            </Link>
          );
        }
        return (
          <div key={n.id} className="group relative">
            <Link
              href={hrefFor(n)}
              className="flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {label(n)}
              <span className="text-xs">▾</span>
            </Link>
            <div className="invisible absolute left-0 top-full z-50 max-h-[70vh] w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
              {children.map((c) => (
                <NavDropdownNode key={c.id} node={c} hrefFor={hrefFor} label={label} depth={0} />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function NavDropdownNode({
  node,
  hrefFor,
  label,
  depth,
}: {
  node: NavNode;
  hrefFor: (n: NavNode) => string;
  label: (n: NavNode) => string;
  depth: number;
}) {
  const children = node.children.filter((c) => c.isVisible);
  if (node.isExternal) {
    return (
      <a
        href={node.path}
        target={node.target || "_self"}
        rel="noopener"
        className="block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
      >
        {label(node)}
      </a>
    );
  }
  if (children.length === 0) {
    return (
      <Link
        href={hrefFor(node)}
        className="block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
      >
        {label(node)}
      </Link>
    );
  }
  return (
    <div>
      <Link
        href={hrefFor(node)}
        className="flex items-center justify-between whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
      >
        {label(node)}
        <span className="ml-2 text-xs text-slate-400">▸</span>
      </Link>
      <div className="ml-3 border-l border-slate-100 pl-2" style={{ marginTop: depth === 0 ? 0 : undefined }}>
        {children.map((c) => (
          <NavDropdownNode key={c.id} node={c} hrefFor={hrefFor} label={label} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}
