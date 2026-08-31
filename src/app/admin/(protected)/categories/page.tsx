import Link from "next/link";
import { db } from "@/lib/db";
import DeleteCategoryButton from "./delete-category-button";

type CategoryNode = {
  id: string;
  code: string;
  icon: string | null;
  sortOrder: number;
  parentId: string | null;
  zhName: string;
  enName: string;
  children: CategoryNode[];
  productCount: number;
};

function buildTree(
  cats: {
    id: string;
    code: string;
    icon: string | null;
    sortOrder: number;
    parentId: string | null;
    translations: { locale: string; name: string }[];
    _count: { products: number };
  }[],
  parentId: string | null = null
): CategoryNode[] {
  return cats
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
    .map((c) => {
      const t = Object.fromEntries(c.translations.map((tr) => [tr.locale, tr]));
      return {
        id: c.id,
        code: c.code,
        icon: c.icon,
        sortOrder: c.sortOrder,
        parentId: c.parentId,
        zhName: t["zh"]?.name ?? c.code,
        enName: t["en"]?.name ?? "",
        productCount: c._count.products,
        children: buildTree(cats, c.id),
      };
    });
}

function CategoryRow({ node, depth }: { node: CategoryNode; depth: number }) {
  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
            {depth > 0 && <span className="text-slate-300">└</span>}
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
          <div className="flex items-center gap-2">
            <Link href={`/admin/categories/${node.id}/edit`} className="text-sky-600 hover:underline">
              编辑
            </Link>
            <DeleteCategoryButton id={node.id} />
          </div>
        </td>
      </tr>
      {node.children.map((child) => (
        <CategoryRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default async function CategoriesPage() {
  const cats = await db.category.findMany({
    include: {
      translations: true,
      _count: { select: { products: true } },
    },
  });

  const tree = buildTree(cats as any);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">产品类别</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {cats.length} 个类别，树形结构
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          + 新增类别
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {cats.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            暂无类别，点击右上角新增
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">类别名称</th>
                <th className="px-4 py-3 font-medium">代码</th>
                <th className="px-4 py-3 font-medium">英文名</th>
                <th className="px-4 py-3 font-medium">排序</th>
                <th className="px-4 py-3 font-medium">产品数</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tree.map((node) => (
                <CategoryRow key={node.id} node={node} depth={0} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
