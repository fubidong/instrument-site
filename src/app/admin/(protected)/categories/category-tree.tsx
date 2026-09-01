"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteCategoryButton from "./delete-category-button";

export type CategoryTreeNode = {
  id: string;
  code: string;
  icon: string | null;
  sortOrder: number;
  parentId: string | null;
  zhName: string;
  enName: string;
  productCount: number;
  children: CategoryTreeNode[];
};

export default function CategoryTree({
  nodes,
  defaultExpanded,
}: {
  nodes: CategoryTreeNode[];
  defaultExpanded: string[];
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // 折叠集合取反判断展开：默认全展开（defaultExpanded 全集），折叠过的才收起
  const isOpen = (id: string) => !collapsed.has(id);

  function renderNode(node: CategoryTreeNode, depth: number): React.ReactNode {
    const hasChildren = node.children.length > 0;
    const open = isOpen(node.id);
    return (
      <>
        <tr className="hover:bg-slate-50">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggle(node.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title={open ? "折叠" : "展开"}
                >
                  {open ? "▼" : "▶"}
                </button>
              ) : (
                <span className="inline-block w-5 shrink-0 text-slate-200">•</span>
              )}
              {node.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={node.icon} alt="" className="h-6 w-6 rounded object-contain bg-white" />
              ) : (
                <span className="text-slate-300">▫</span>
              )}
              <span className="font-medium text-slate-800">{node.zhName}</span>
            </div>
          </td>
          <td className="px-4 py-3 font-mono text-xs text-slate-500">{node.code}</td>
          <td className="px-4 py-3 text-slate-600">{node.enName || "-"}</td>
          <td className="px-4 py-3 text-slate-500">{node.sortOrder}</td>
          <td className="px-4 py-3 text-slate-500">{node.productCount}</td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href={`/admin/categories/${node.id}/edit`} className="text-sky-600 hover:underline">
                编辑
              </Link>
              <Link
                href={`/admin/categories/new?parent=${node.id}`}
                className="text-emerald-600 hover:underline"
                title="在此类别下新建子类别"
              >
                + 新建下一类别
              </Link>
              <DeleteCategoryButton id={node.id} />
            </div>
          </td>
        </tr>
        {hasChildren &&
          open &&
          node.children.map((child) => renderNode(child, depth + 1))}
      </>
    );
  }

  return (
    <tbody className="divide-y divide-slate-100">
      {nodes.map((node) => renderNode(node, 0))}
    </tbody>
  );
}
