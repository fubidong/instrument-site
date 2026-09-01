"use client";

import { useMemo, useState } from "react";
import { toggleCategoryNavAction, batchSetCategoryNavAction, createNavCategoryAction } from "./actions";

export type NavCategory = {
  id: string;
  code: string;
  parentId: string | null;
  brandId: string | null;
  sortOrder: number;
  showInNav: boolean;
  zhName: string;
  enName: string;
  productCount: number;
};

export type NavBrand = {
  id: string;
  code: string;
  sortOrder: number;
  zhName: string;
  enName: string;
};

type TreeNode = NavCategory & { children: TreeNode[] };

function buildTree(cats: NavCategory[], parentId: string | null = null): TreeNode[] {
  return cats
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
    .map((c) => ({ ...c, children: buildTree(cats, c.id) }));
}

function collectParentIds(nodes: TreeNode[], out: string[] = []) {
  for (const n of nodes) {
    if (n.children.length > 0) {
      out.push(n.id);
      collectParentIds(n.children, out);
    }
  }
  return out;
}

function filterTree(nodes: TreeNode[], keyword: string): TreeNode[] {
  if (!keyword.trim()) return nodes;
  const k = keyword.trim().toLowerCase();
  return nodes
    .map((n) => {
      const children = filterTree(n.children, keyword);
      const selfHit =
        n.zhName.toLowerCase().includes(k) ||
        n.enName.toLowerCase().includes(k) ||
        n.code.toLowerCase().includes(k);
      if (selfHit) return { ...n, children };
      if (children.length > 0) return { ...n, children };
      return null;
    })
    .filter((n): n is TreeNode => n !== null);
}

export default function NavigationManager({
  categories,
  brands,
}: {
  categories: NavCategory[];
  brands: NavBrand[];
}) {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [addBrand, setAddBrand] = useState<string>("");
  const [addParent, setAddParent] = useState<string>("");
  const [addNameEn, setAddNameEn] = useState("");
  const [addCode, setAddCode] = useState("");

  // 当前 tab 对应的品类集
  const scoped = useMemo(() => {
    if (tab === "global") return categories.filter((c) => c.brandId === null);
    if (tab === "all") return categories;
    return categories.filter((c) => c.brandId === tab);
  }, [categories, tab]);

  // 分组：all 模式按综合站+品牌分组；其他模式单组
  const groups = useMemo(() => {
    if (tab === "global") {
      return [{ key: "global", title: "综合站（全站品类）", cats: scoped }];
    }
    if (tab === "all") {
      const gs: { key: string; title: string; cats: NavCategory[] }[] = [];
      const globalCats = categories.filter((c) => c.brandId === null);
      if (globalCats.length > 0)
        gs.push({ key: "global", title: "综合站（全站品类）", cats: globalCats });
      for (const b of brands) {
        const bc = categories.filter((c) => c.brandId === b.id);
        if (bc.length > 0) gs.push({ key: b.id, title: b.zhName, cats: bc });
      }
      return gs;
    }
    const b = brands.find((x) => x.id === tab);
    return [{ key: tab, title: b ? b.zhName : tab, cats: scoped }];
  }, [categories, brands, tab, scoped]);

  const isOpen = (id: string) => !collapsed.has(id);
  const toggle = (id: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // 新增表单的父级选项（当前所选站点分组下的品类，含层级缩进）
  const parentOptions = useMemo(() => {
    const scopedCats = addBrand
      ? categories.filter((c) => c.brandId === addBrand)
      : categories.filter((c) => c.brandId === null);
    const out: { id: string; zhName: string; indent: string }[] = [];
    const walk = (pid: string | null, depth: number) => {
      scopedCats
        .filter((c) => c.parentId === pid)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
        .forEach((c) => {
          out.push({ id: c.id, zhName: c.zhName || c.code, indent: "　".repeat(depth) });
          walk(c.id, depth + 1);
        });
    };
    walk(null, 0);
    return out;
  }, [categories, addBrand]);

  const shownCount = scoped.filter((c) => c.showInNav).length;
  const brandScopeForBatch = tab === "all" ? "__all__" : tab === "global" ? "global" : tab;

  function renderNode(node: TreeNode, depth: number) {
    const hasChildren = node.children.length > 0;
    const open = isOpen(node.id);
    return (
      <>
        <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
          <td className="whitespace-nowrap px-4 py-2">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 22}px` }}>
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
              <span className={`text-sm ${node.zhName ? "text-slate-800" : "text-slate-400"}`}>
                {node.zhName || node.code}
              </span>
              <span className="font-mono text-[11px] text-slate-400">{node.code}</span>
            </div>
          </td>
          <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-400">{node.enName}</td>
          <td className="whitespace-nowrap px-4 py-2 text-center text-xs text-slate-400">
            {node.productCount}
          </td>
          <td className="whitespace-nowrap px-4 py-2 text-right">
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
        </tr>
        {hasChildren && open && node.children.map((child) => renderNode(child, depth + 1))}
      </>
    );
  }

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
              placeholder="搜索品类名称 / 代码..."
              className="w-52 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
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
              onClick={() => setCollapsed(new Set(collectParentIds(groups.flatMap((g) => buildTree(g.cats)))))}
              className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              全部折叠
            </button>
            <div className="mx-1 h-5 w-px bg-slate-200" />
            <form action={batchSetCategoryNavAction}>
              <input type="hidden" name="brandId" value={brandScopeForBatch} />
              <input type="hidden" name="show" value="true" />
              <button
                type="submit"
                className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-100"
                title={`当前${tab === "all" ? "全部" : "分组"}所有品类设为导航显示`}
              >
                全部显示
              </button>
            </form>
            <form action={batchSetCategoryNavAction}>
              <input type="hidden" name="brandId" value={brandScopeForBatch} />
              <input type="hidden" name="show" value="false" />
              <button
                type="submit"
                className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-600 hover:bg-red-100"
                title={`当前${tab === "all" ? "全部" : "分组"}所有品类设为导航隐藏`}
              >
                全部隐藏
              </button>
            </form>
            <div className="mx-1 h-5 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => {
                const defaultBrand =
                  tab === "all" || tab === "global" ? "" : tab;
                setAddBrand(defaultBrand);
                setAddParent("");
                setAddNameEn("");
                setAddCode("");
                setShowAdd((v) => !v);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                showAdd
                  ? "bg-sky-600 text-white"
                  : "border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100"
              }`}
            >
              {showAdd ? "收起表单" : "+ 新增菜单项"}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          当前范围 {shownCount}/{scoped.length} 个品类在导航显示 · 点击开关即时生效，前台导航实时更新
        </p>
      </div>

      {/* 新增菜单项表单 */}
      {showAdd && (
        <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            新增导航菜单项
            <span className="ml-2 text-xs font-normal text-slate-400">
              一级菜单 = 顶级导航项；二级菜单 = 挂在某个一级菜单下
            </span>
          </h3>
          <form action={createNavCategoryAction} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">所属站点</label>
                <select
                  name="brandId"
                  value={addBrand}
                  onChange={(e) => {
                    setAddBrand(e.target.value);
                    setAddParent("");
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">综合站（全站品类）</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.zhName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">上级菜单</label>
                <select
                  name="parentId"
                  value={addParent}
                  onChange={(e) => setAddParent(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">无（一级菜单）</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.indent}
                      {c.zhName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">中文名称 *</label>
                <input
                  name="name_zh"
                  placeholder="如 示波器"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">英文名称 *</label>
                <input
                  name="name_en"
                  value={addNameEn}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddNameEn(v);
                    if (!addCode || addCode === autoCodeFromEn(addNameEn)) {
                      setAddCode(autoCodeFromEn(v));
                    }
                  }}
                  placeholder="如 Oscilloscope"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">代码 *</label>
                <input
                  name="code"
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value)}
                  placeholder="如 OSCILLOSCOPE"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">排序</label>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={0}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                  保存菜单项
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 分组卡片 */}
      {groups.map((g) => {
        const tree = buildTree(g.cats);
        const filtered = filterTree(tree, search);
        return (
          <div key={g.key} className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
              <span className="text-sm font-semibold text-slate-700">{g.title}</span>
              <span className="text-xs text-slate-400">
                {g.cats.length} 个品类 · 显示 {g.cats.filter((c) => c.showInNav).length}
              </span>
            </div>
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                {search ? "无匹配品类" : "暂无品类"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-400">
                      <th className="whitespace-nowrap px-4 py-2 text-xs font-medium">名称</th>
                      <th className="whitespace-nowrap px-4 py-2 text-xs font-medium">英文名</th>
                      <th className="whitespace-nowrap px-4 py-2 text-center text-xs font-medium">产品数</th>
                      <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium">导航显示</th>
                    </tr>
                  </thead>
                  <tbody>{filtered.map((node) => renderNode(node, 0))}</tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
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
        active
          ? "bg-sky-600 font-medium text-white"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

/** 英文名 → 代码（大写 + 连字符，如 "Power Supply" → "POWER-SUPPLY"） */
function autoCodeFromEn(en: string): string {
  return en
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
