"use client";

import { useTransition, useState } from "react";
import ParamGroupForm from "./group-form";
import { deleteParamGroupAction } from "./actions";

type Group = {
  id: string;
  code: string;
  sortOrder: number;
  translations: { locale: string; name: string }[];
  _count: { paramDefs: number };
};

export default function GroupList({
  categoryId,
  groups,
}: {
  categoryId: string;
  groups: Group[];
}) {
  const [editing, setEditing] = useState<Group | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete(g: Group) {
    if (!confirm(`确定删除分组「${g.code}」？有参数定义将无法删除。`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", g.id);
      try {
        await deleteParamGroupAction(fd);
      } catch (e: any) {
        alert(e.message || "删除失败");
      }
    });
  }

  const nameOf = (g: Group, locale: string) =>
    g.translations.find((t) => t.locale === locale)?.name ?? "";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowNew(true);
          }}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          + 新增分组
        </button>
      </div>

      {showNew && (
        <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">新增参数分组</h3>
          <ParamGroupForm
            categoryId={categoryId}
            group={null}
            onDone={() => setShowNew(false)}
          />
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        {groups.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            暂无参数分组，点击右上角新增
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">分组代码</th>
                <th className="px-4 py-3 font-medium">中文名</th>
                <th className="px-4 py-3 font-medium">英文名</th>
                <th className="px-4 py-3 font-medium">排序</th>
                <th className="px-4 py-3 font-medium">参数数</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{g.code}</td>
                  <td className="px-4 py-3 text-slate-800">{nameOf(g, "zh")}</td>
                  <td className="px-4 py-3 text-slate-600">{nameOf(g, "en")}</td>
                  <td className="px-4 py-3 text-slate-500">{g.sortOrder}</td>
                  <td className="px-4 py-3 text-slate-500">{g._count.paramDefs}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNew(false);
                          setEditing(g);
                        }}
                        className="text-sky-600 hover:underline"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(g)}
                        disabled={pending}
                        className="text-red-500 hover:underline disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            编辑分组 · {editing.code}
          </h3>
          <ParamGroupForm
            categoryId={categoryId}
            group={editing}
            onDone={() => setEditing(null)}
          />
        </div>
      )}
    </div>
  );
}
