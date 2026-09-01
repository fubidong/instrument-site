import Link from "next/link";
import { db } from "@/lib/db";
import CategoryTree, { type CategoryTreeNode } from "./category-tree";

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
): CategoryTreeNode[] {
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

/** 收集所有有子类的节点 id（用于默认全部展开） */
function collectParentIds(nodes: CategoryTreeNode[], out: string[] = []) {
  for (const n of nodes) {
    if (n.children.length > 0) {
      out.push(n.id);
      collectParentIds(n.children, out);
    }
  }
  return out;
}

export default async function CategoriesPage() {
  const cats = await db.category.findMany({
    include: {
      translations: true,
      _count: { select: { products: true } },
    },
  });

  const tree = buildTree(cats as any);
  const defaultCollapsed = collectParentIds(tree);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">产品类别</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {cats.length} 个类别，树形结构（支持展开/折叠）
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          + 新增类别
        </Link>
      </div>

      {cats.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          暂无类别，点击右上角新增
        </div>
      ) : (
        <CategoryTree nodes={tree} defaultCollapsed={defaultCollapsed} />
      )}
    </div>
  );
}
