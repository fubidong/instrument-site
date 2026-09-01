"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteCategoryButton from "./delete-category-button";
import { toggleCategoryNavAction } from "./actions";

export type CategoryTreeNode = {
  id: string;
  code: string;
  icon: string | null;
  sortOrder: number;
  showInNav: boolean;
  parentId: string | null;
  zhName: string;
  enName: string;
  productCount: number;
  children: CategoryTreeNode[];
};

export default function CategoryTree({
  nodes,
  defaultCollapsed,
}: {
  nodes: CategoryTreeNode[];
  defaultCollapsed: string[];
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(defaultCollapsed));
  const toggle = (id: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const isOpen = (id: string) => !collapsed.has(id);

  function renderNode(node: CategoryTreeNode, depth: number): React.ReactNode {
    const hasChildren = node.children.length > 0;
    const open = isOpen(node.id);
    return (
      <>
        <tr className="hover:bg-slate-50">
          <td className="whitespace-nowrap px-4 py-3">
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
          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{node.code}</td>
          <td className="whitespace-nowrap px-4 py-3 text-slate-600">{node.enName || "-"}</td>
          <td className="whitespace-nowrap px-4 py-3 text-slate-500">{node.sortOrder}</td>
          <td className="whitespace-nowrap px-4 py-3">
            <form action={toggleCategoryNavAction}>
              <input type="hidden" name="id" value={node.id} />
              <input type="hidden" name="showInNav" value={String(!node.showInNav)} />
              <button
                type="submit"
                title={node.showInNav ? "在导航显示（点击隐藏）" : "不在导航显示（点击显示）"}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  node.showInNav ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    node.showInNav ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </form>
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-slate-500">{node.productCount}</td>
          <td className="whitespace-nowrap px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href={`/admin/categories/${node.id}/edit`} className="text-sky-600 hover:underline">
                编辑
              </Link>
              <Link
                href={`/admin/categories/new?parent=${node.id}`}
                className="text-emerald-600 hover:underline"
                title="在此类别下新建子类别"
              >
                +
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
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <span className="text-xs text-slate-400">
          共 {countNodes(nodes)} 个类别 · 点击 ▾ 折叠 / ▸ 展开
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed(new Set())}
            className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            全部展开
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(new Set(defaultCollapsed))}
            className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            全部折叠
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="whitespace-nowrap px-4 py-3 font-medium">类别名称</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">代码</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">英文名</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">排序</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                导航显示
                <span className="ml-1 text-xs font-normal text-slate-400" title="控制该类别是否在站点主导航显示">ⓘ</span>
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">产品数</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {nodes.map((node) => renderNode(node, 0))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function countNodes(nodes: CategoryTreeNode[]): number {
  return nodes.reduce((n, x) => n + 1 + countNodes(x.children), 0);
}
