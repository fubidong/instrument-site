"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  deleteProductAction,
  batchDeleteProductsAction,
  batchToggleProductsAction,
  duplicateProductAction,
} from "./actions";

type Product = {
  id: string;
  model: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  coverImage: string | null;
  images: { imagePath: string }[];
  productLine: {
    code: string;
    translations: { locale: string; name: string }[];
    brand: { translations: { locale: string; name: string }[] };
  };
  translations: { locale: string; name: string }[];
};

type CategoryOption = {
  id: string;
  label: string;
  code: string;
  parentId: string | null;
  brandId: string | null;
  sortOrder: number;
  matchIds: string[];
  matchBrands: string[];
};

type LineOption = {
  id: string;
  label: string;
  code: string;
  brandId: string;
  categoryId: string;
};

export default function ProductsTable({
  products,
  brandOptions,
  categoryOptions,
  lineOptions,
  currentBrand,
  currentCategory,
  currentLine,
  currentStatus,
  currentQ,
}: {
  products: Product[];
  brandOptions: { id: string; label: string }[];
  categoryOptions: CategoryOption[];
  lineOptions: LineOption[];
  currentBrand: string;
  currentCategory: string;
  currentLine: string;
  currentStatus: string;
  currentQ: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  // 搜索框本地状态 + 防抖
  const [searchInput, setSearchInput] = useState(currentQ);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // 当外部 currentQ 变化时（如清除筛选），同步本地输入框
  useEffect(() => {
    setSearchInput(currentQ);
  }, [currentQ]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") params.delete(key);
    else params.set(key, value);
    router.push(`/admin/products?${params.toString()}`);
  }

  // 防抖搜索：输入后 400ms 才触发 URL 更新
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      updateFilter("q", value);
    }, 400);
  }

  // 品类深度（缩进显示层级）
  const catDepth = useMemo(() => {
    const byId = new Map(categoryOptions.map((c) => [c.id, c]));
    const depth = new Map<string, number>();
    function d(id: string): number {
      if (depth.has(id)) return depth.get(id)!;
      const c = byId.get(id);
      const v = c?.parentId ? d(c.parentId) + 1 : 0;
      depth.set(id, v);
      return v;
    }
    categoryOptions.forEach((c) => d(c.id));
    return depth;
  }, [categoryOptions]);

  // 类别下拉智能切换：
  //  - 不选品牌 → 只显示全站主品类（顶层，扁平化，不分子品类）
  //  - 选品牌   → 只显示该品牌的品牌分类（含子分类层级）
  const visibleCategories = useMemo(() => {
    if (currentBrand === "all") {
      return categoryOptions.filter((c) => c.brandId === null && c.parentId === null);
    }
    return categoryOptions.filter((c) => c.brandId === currentBrand);
  }, [categoryOptions, currentBrand]);

  // 系列下拉：按品牌 + 品类联动
  const currentCatOption = useMemo(
    () => categoryOptions.find((c) => c.id === currentCategory),
    [categoryOptions, currentCategory]
  );
  const catMatchIds = useMemo(
    () => new Set(currentCatOption?.matchIds ?? []),
    [currentCatOption]
  );
  const visibleLines = useMemo(
    () =>
      lineOptions.filter(
        (l) =>
          (currentBrand === "all" || l.brandId === currentBrand) &&
          (currentCategory === "all" || catMatchIds.has(l.categoryId))
      ),
    [lineOptions, currentBrand, currentCategory, catMatchIds]
  );

  // 当前选中项若被联动过滤掉，仍保留一个 option（避免 select 空白）
  function withCurrent(list: any[], current: string) {
    if (current === "all" || list.some((x) => x.id === current)) return list;
    const cur = [...categoryOptions, ...lineOptions].find((x) => x.id === current);
    return cur ? [cur, ...list] : list;
  }

  function notify(r: any) {
    if (r?.error) alert(r.error);
    else if (r?.success) setMsg(r.warning ? `${r.success}；${r.warning}` : r.success);
    setTimeout(() => setMsg(null), 3000);
  }

  function handleDelete(id: string) {
    if (!confirm("确定删除该产品？有关联将无法删除。")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      try {
        await deleteProductAction(fd);
        router.refresh();
      } catch (e: any) {
        alert(e.message || "删除失败");
      }
    });
  }

  function handleBatchDelete() {
    if (selected.length === 0) return;
    if (!confirm(`确定删除选中的 ${selected.length} 个产品？（有关联的将跳过）`)) return;
    startTransition(async () => {
      const fd = new FormData();
      selected.forEach((id) => fd.append("ids", id));
      const r = await batchDeleteProductsAction(fd);
      notify(r);
      setSelected([]);
      router.refresh();
    });
  }

  function handleBatchToggle(active: boolean) {
    if (selected.length === 0) return;
    startTransition(async () => {
      const fd = new FormData();
      selected.forEach((id) => fd.append("ids", id));
      fd.append("isActive", active ? "on" : "");
      const r = await batchToggleProductsAction(fd);
      notify(r);
      setSelected([]);
      router.refresh();
    });
  }

  function handleDuplicate(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      const r = (await duplicateProductAction(fd)) as { redirect?: string; error?: string };
      if (r?.error) alert(r.error);
      else if (r?.redirect) window.location.href = r.redirect;
      else router.refresh();
    });
  }

  const isAllSelected = products.length > 0 && selected.length === products.length;
  const nameOf = (p: Product, locale: string) =>
    p.translations.find((tr) => tr.locale === locale)?.name ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">产品型号</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {products.length} 个型号{currentQ && `，搜索"${currentQ}"`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => handleBatchToggle(true)}
                disabled={pending}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                批量启用
              </button>
              <button
                type="button"
                onClick={() => handleBatchToggle(false)}
                disabled={pending}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                批量停用
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                disabled={pending}
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                批量删除 ({selected.length})
              </button>
            </>
          )}
          <Link
            href="/admin/products/new"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            + 新增产品
          </Link>
        </div>
      </div>

      {msg && (
        <div className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
          {msg}
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <select
          value={currentBrand}
          onChange={(e) => updateFilter("brand", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        >
          <option value="all">全部品牌</option>
          {brandOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
        <select
          value={currentCategory}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        >
          <option value="all">全部类别</option>
          {withCurrent(visibleCategories, currentCategory)
            .slice()
            .sort(
              (a, b) =>
                (catDepth.get(a.id) ?? 0) - (catDepth.get(b.id) ?? 0) ||
                a.sortOrder - b.sortOrder
            )
            .map((c) => (
              <option key={c.id} value={c.id}>
                {`${c.brandId ? "◆ " : ""}${"　".repeat(catDepth.get(c.id) ?? 0)}${c.label}`}
              </option>
            ))}
        </select>
        <select
          value={currentLine}
          onChange={(e) => updateFilter("line", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        >
          <option value="all">全部系列</option>
          {withCurrent(visibleLines, currentLine).map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <select
          value={currentStatus}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        >
          <option value="all">全部状态</option>
          <option value="active">启用</option>
          <option value="inactive">停用</option>
        </select>
        <input
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="搜索型号/名称..."
          className="w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        />
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          清除筛选
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {products.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">没有符合条件的产品</p>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="w-10 whitespace-nowrap px-3 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() =>
                      setSelected(isAllSelected ? [] : products.map((p) => p.id))
                    }
                    className="h-4 w-4"
                  />
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">主图</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">型号</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">品牌</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">系列</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">中文名</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">英文名</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">排序</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">状态</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const bt = Object.fromEntries(
                  p.productLine.brand.translations.map((tr) => [tr.locale, tr])
                );
                const lt = Object.fromEntries(p.productLine.translations.map((tr) => [tr.locale, tr]));
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 ${selected.includes(p.id) ? "bg-sky-50/50" : ""}`}
                  >
                    <td className="whitespace-nowrap px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() =>
                          setSelected((s) =>
                            s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]
                          )
                        }
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <MainImage
                        src={p.coverImage ?? p.images[0]?.imagePath ?? ""}
                        model={p.model}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                      {p.model}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{bt["zh"]?.name ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{lt["zh"]?.name ?? p.productLine.code}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">{nameOf(p, "zh") ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{nameOf(p, "en") ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{p.sortOrder}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.isActive ? "启用" : "停用"}
                        {p.isFeatured && (
                          <span className="ml-1 rounded bg-rose-100 px-1 text-rose-600">荐</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="text-sky-600 hover:underline"
                        >
                          编辑
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(p.id)}
                          disabled={pending}
                          className="text-emerald-600 hover:underline disabled:opacity-50"
                        >
                          复制
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          disabled={pending}
                          className="text-red-500 hover:underline disabled:opacity-50"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/** 产品主图缩略图：有图显示 44x44 缩略图，无图显示占位 */
function MainImage({ src, model }: { src: string; model: string }) {
  if (!src) {
    return (
      <span className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-300">
        {model.slice(0, 1)}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={model}
      className="h-11 w-11 rounded-md border border-slate-200 object-contain"
      loading="lazy"
    />
  );
}
