"use client";

import { useMemo, useState, useTransition } from "react";
import type { NavNode } from "@/lib/nav";
import type { NavBrandOpt, NavPageOption } from "./page";
import NavDialog, { type DialogMenu } from "./nav-dialog";
import { toggleNavVisibleAction, deleteNavAction, batchSortNavAction } from "./actions";

type DialogState = {
  mode: "create" | "edit";
  menu?: DialogMenu | null;
  presetBrandId?: string | null;
  presetParentId?: string | null;
};

function filterTree(nodes: NavNode[], kw: string): NavNode[] {
  if (!kw.trim()) return nodes;
  const k = kw.trim().toLowerCase();
  return nodes
    .map((n) => {
      const children = filterTree(n.children, kw);
      const hit =
        n.name.toLowerCase().includes(k) ||
        n.enName.toLowerCase().includes(k) ||
        n.path.toLowerCase().includes(k);
      if (hit) return { ...n, children };
      if (children.length > 0) return { ...n, children };
      return null;
    })
    .filter((n): n is NavNode => n !== null);
}

function collectParentIds(nodes: NavNode[], out: string[] = []) {
  for (const n of nodes) {
    if (n.children.length > 0) {
      out.push(n.id);
      collectParentIds(n.children, out);
    }
  }
  return out;
}

export default function NavigationManager({
  tree,
  brands,
  pageOptions,
}: {
  tree: NavNode[];
  brands: NavBrandOpt[];
  pageOptions: NavPageOption[];
}) {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [, startTransition] = useTransition();

  // 全部扁平化节点（供弹窗父级下拉）
  const allMenus = useMemo(() => {
    const out: DialogMenu[] = [];
    const walk = (nodes: NavNode[]) =>
      nodes.forEach((n) => {
        out.push({
          id: n.id,
          parentId: n.parentId,
          icon: n.icon,
          path: n.path,
          permission: n.permission,
          sort: n.sort,
          isVisible: n.isVisible,
          isExternal: n.isExternal,
          target: n.target,
          platform: n.platform,
          brandId: n.brandId,
          name: n.name,
          enName: n.enName,
        });
        walk(n.children);
      });
    walk(tree);
    return out;
  }, [tree]);

  // 当前 tab 对应的分组
  const groups = useMemo(() => {
    const filterBy = (brandId: string | null) =>
      filterTree(
        tree.filter((n) => (n.brandId ?? null) === brandId),
        search
      );
    if (tab === "global") return [{ key: "global", title: "综合站", nodes: filterBy(null) }];
    if (tab === "all") {
      const gs: { key: string; title: string; nodes: NavNode[] }[] = [];
      const g = filterBy(null);
      if (g.length > 0) gs.push({ key: "global", title: "综合站", nodes: g });
      for (const b of brands) {
        const bn = filterBy(b.id);
        if (bn.length > 0) gs.push({ key: b.id, title: b.zhName, nodes: bn });
      }
      return gs;
    }
    const b = brands.find((x) => x.id === tab);
    return [{ key: tab, title: b ? b.zhName : tab, nodes: filterBy(tab) }];
  }, [tree, brands, tab, search]);

  const isOpen = (id: string) => !collapsed.has(id);
  const toggle = (id: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function handleSortChange(id: string, value: number) {
    startTransition(async () => {
      await batchSortNavAction([{ id, sort: value }]);
    });
  }

  function renderNode(node: NavNode, depth: number) {
    const hasChildren = node.children.length > 0;
    const open = isOpen(node.id);
    return (
      <tr key={node.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
        <td className="whitespace-nowrap px-4 py-2">
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
            {node.icon && <span className="shrink-0 text-sm leading-none">{node.icon}</span>}
            <span className="font-medium text-slate-800">{node.name || node.enName}</span>
            <span className="text-xs text-slate-400">{node.enName}</span>
            {node.isExternal && (
              <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-700">外链</span>
            )}
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">{node.path}</td>
        <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-400">
          {node.permission || "-"}
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <form action={toggleNavVisibleAction}>
            <input type="hidden" name="id" value={node.id} />
            <input type="hidden" name="isVisible" value={String(!node.isVisible)} />
            <button
              type="submit"
              title={node.isVisible ? "在导航显示（点击隐藏）" : "不在导航显示（点击显示）"}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                node.isVisible ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  node.isVisible ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </form>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <input
            type="number"
            min={0}
            defaultValue={node.sort}
            onBlur={(e) => handleSortChange(node.id, parseInt(e.target.value) || 0)}
            className="w-16 rounded border border-slate-200 px-1.5 py-1 text-center text-xs text-slate-600 outline-none focus:border-sky-500"
          />
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDialog({ mode: "edit", menu: node as unknown as DialogMenu })}
              className="text-xs text-sky-600 hover:underline"
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() =>
                setDialog({
                  mode: "create",
                  presetBrandId: node.brandId,
                  presetParentId: node.id,
                })
              }
              className="text-xs text-emerald-600 hover:underline"
              title="在此菜单下新增子菜单"
            >
              +
            </button>
            <DeleteNavButton id={node.id} name={node.name} />
          </div>
        </td>
      </tr>
    );
  }

  const flatten = (nodes: NavNode[]): React.ReactNode[] =>
    nodes
      .map((n) => [renderNode(n, 0), ...(isOpen(n.id) ? flatten(n.children) : [])])
      .flat();

  return (
    <div className="space-y-4">
      {/* 工具条 */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            <TabBtn active={tab === "all"} onClick={() => setTab("all")}>
              全部
            </TabBtn>
            <TabBtn active={tab === "global"} onClick={() => setTab("global")}>
              综合站
            </TabBtn>
            {brands.map((b) => (
              <TabBtn key={b.id} active={tab === b.id} onClick={() => setTab(b.id)}>
                {b.zhName}
              </TabBtn>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCollapsed(new Set());
              }}
              placeholder="搜索名称 / 路径..."
              className="w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={() => setCollapsed(new Set())}
              className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              全部展开
            </button>
            <button
              type="button"
              onClick={() =>
                setCollapsed(new Set(collectParentIds(groups.flatMap((g) => g.nodes))))
              }
              className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              全部折叠
            </button>
            <div className="mx-1 h-5 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() =>
                setDialog({
                  mode: "create",
                  presetBrandId:
                    tab === "all" || tab === "global" ? null : tab,
                })
              }
              className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
            >
              + 新增菜单项
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          树形菜单 · 点击开关即时生效 · 排序数字失焦自动保存 · 删除为软删除（级联子菜单）
        </p>
      </div>

      {/* 分组卡片 */}
      {groups.map((g) => (
        <div key={g.key} className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <span className="text-sm font-semibold text-slate-700">{g.title}</span>
            <span className="text-xs text-slate-400">{countNodes(g.nodes)} 个菜单项</span>
          </div>
          {g.nodes.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              {search ? "无匹配菜单" : "暂无菜单项"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-400">
                    <th className="whitespace-nowrap px-4 py-2 text-xs font-medium">名称</th>
                    <th className="whitespace-nowrap px-4 py-2 text-xs font-medium">路径</th>
                    <th className="whitespace-nowrap px-4 py-2 text-xs font-medium">权限</th>
                    <th className="whitespace-nowrap px-4 py-2 text-xs font-medium">显示</th>
                    <th className="whitespace-nowrap px-4 py-2 text-xs font-medium">排序</th>
                    <th className="whitespace-nowrap px-4 py-2 text-xs font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>{flatten(g.nodes)}</tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* 新增/编辑弹窗 */}
      {dialog && (
        <NavDialog
          mode={dialog.mode}
          menu={dialog.menu}
          brands={brands}
          allMenus={allMenus}
          pageOptions={pageOptions}
          presetBrandId={dialog.presetBrandId}
          presetParentId={dialog.presetParentId}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function DeleteNavButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={async (formData) => {
        if (window.confirm(`确认删除「${name || "该菜单"}」及其所有子菜单？删除后可恢复。`)) {
          await deleteNavAction(formData);
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-red-500 hover:underline">
        删除
      </button>
    </form>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm transition ${
        active ? "bg-sky-600 font-medium text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function countNodes(nodes: NavNode[]): number {
  return nodes.reduce((n, x) => n + 1 + countNodes(x.children), 0);
}
