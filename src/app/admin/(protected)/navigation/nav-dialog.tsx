"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import { createNavAction, updateNavAction, type NavActionResult } from "./actions";
import type { NavBrandOpt, NavPageOption } from "./page";

export type DialogMenu = {
  id: string;
  parentId: string | null;
  icon: string | null;
  path: string;
  permission: string | null;
  sort: number;
  isVisible: boolean;
  isExternal: boolean;
  target: string;
  platform: string;
  brandId: string | null;
  name: string;
  enName: string;
};

export default function NavDialog({
  mode,
  menu,
  brands,
  allMenus,
  pageOptions,
  presetBrandId,
  presetParentId,
  onClose,
}: {
  mode: "create" | "edit";
  menu?: DialogMenu | null;
  brands: NavBrandOpt[];
  allMenus: DialogMenu[];
  pageOptions: NavPageOption[];
  presetBrandId?: string | null;
  presetParentId?: string | null;
  onClose: () => void;
}) {
  const initialState: NavActionResult = { success: false };
  const action = async (_prev: NavActionResult, formData: FormData) => {
    const r = mode === "edit" ? await updateNavAction(formData) : await createNavAction(formData);
    return r;
  };
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  const initialBrandId = menu?.brandId ?? presetBrandId ?? "";
  const [brandIdVal, setBrandIdVal] = useState(initialBrandId);
  const [isExternal, setIsExternal] = useState(menu?.isExternal ?? false);
  const [pathVal, setPathVal] = useState(menu?.path ?? "/");

  // 父级下拉：仅当前所选站点下的菜单（树形缩进）
  const parentOptions = useMemo(() => {
    const scoped = allMenus.filter((m) => (m.brandId ?? "") === brandIdVal);
    const out: { id: string; name: string; indent: string }[] = [];
    const walk = (pid: string | null, depth: number) => {
      scoped
        .filter((m) => m.parentId === pid)
        .sort((a, b) => a.sort - b.sort)
        .forEach((m) => {
          if (m.id !== menu?.id) {
            out.push({ id: m.id, name: m.name || m.enName, indent: "　".repeat(depth) });
            walk(m.id, depth + 1);
          } else {
            walk(m.id, depth + 1);
          }
        });
    };
    walk(null, 0);
    return out;
  }, [allMenus, menu, brandIdVal]);

  // 当前站点可选的已有页面
  const sitePages = useMemo(
    () => pageOptions.filter((o) => (o.brandId ?? null) === (brandIdVal || null)),
    [pageOptions, brandIdVal]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === "edit" ? "编辑菜单项" : "新增菜单项"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {state.error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {mode === "edit" && <input type="hidden" name="id" value={menu!.id} />}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">中文名称 *</label>
              <input
                name="nameZh"
                defaultValue={menu?.name ?? ""}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">英文名称 *</label>
              <input
                name="nameEn"
                defaultValue={menu?.enName ?? ""}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">所属站点</label>
              <select
                name="brandId"
                value={brandIdVal}
                onChange={(e) => setBrandIdVal(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="">综合站</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.zhName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">父级菜单</label>
              <select
                name="parentId"
                defaultValue={menu?.parentId ?? presetParentId ?? ""}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="">无（顶级菜单）</option>
                {parentOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.indent}
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 路径 + 快速选择已有页面 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              {isExternal ? "外链网址 *" : "路径 *"}
            </label>
            <input
              name="path"
              value={pathVal}
              onChange={(e) => setPathVal(e.target.value)}
              placeholder={
                isExternal ? "https:// 完整外链地址" : "如 /products、/category/siglent-oscilloscope"
              }
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
            {!isExternal && (
              <div className="mt-2">
                <label className="mb-1 block text-xs text-slate-400">
                  快速选择已有页面（选后仍可手动修改）
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setPathVal(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-sky-500"
                >
                  <option value="">— 选择页面 —</option>
                  {sitePages.map((o) => (
                    <option key={`${o.brandId}-${o.path}-${o.label}`} value={o.path}>
                      {o.label}（{o.path}）
                    </option>
                  ))}
                </select>
              </div>
            )}
            {isExternal && (
              <p className="mt-1.5 text-xs text-amber-600">
                外链模式下填写完整网址（以 http:// 或 https:// 开头）
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">图标（emoji/类名）</label>
              <input
                name="icon"
                defaultValue={menu?.icon ?? ""}
                placeholder="如 📦 或 Home"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">排序</label>
              <input
                name="sort"
                type="number"
                min={0}
                defaultValue={menu?.sort ?? 0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">权限标识</label>
              <input
                name="permission"
                defaultValue={menu?.permission ?? ""}
                placeholder="可选"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">打开方式</label>
              <select
                name="target"
                defaultValue={menu?.target ?? "_self"}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="_self">当前页 _self</option>
                <option value="_blank">新窗口 _blank</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">端</label>
              <select
                name="platform"
                defaultValue={menu?.platform ?? "web"}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="web">web（公网站点）</option>
                <option value="admin">admin</option>
                <option value="app">app</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="isVisible"
                    value="true"
                    defaultChecked={menu?.isVisible ?? true}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600"
                  />
                  显示
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="isExternal"
                    value="true"
                    checked={isExternal}
                    onChange={(e) => setIsExternal(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600"
                  />
                  外链
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {pending ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
