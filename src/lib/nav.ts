import { db } from "@/lib/db";

export type NavNode = {
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
  children: NavNode[];
};

export type GetNavOptions = {
  /** null=综合站；string=品牌站；undefined=全部 */
  brandId?: string | null;
  platform?: string;
  /** true=含隐藏项（后台用）；false=仅可见（前台用） */
  includeHidden?: boolean;
};

/**
 * 获取导航菜单树（递归一次加载，过滤软删除）
 * - 后台：brandId 传 undefined 拿全部；传 null 拿综合站；传品牌 id 拿品牌站
 * - 前台：传 brandId + includeHidden=false 拿可见导航
 */
export async function getNavTree(options: GetNavOptions = {}): Promise<NavNode[]> {
  const { brandId, platform = "web", includeHidden = false } = options;
  const where: any = { deletedAt: null, platform };
  if (brandId === null) where.brandId = null;
  else if (brandId !== undefined) where.brandId = brandId;
  if (!includeHidden) where.isVisible = true;

  const menus = await db.navMenu.findMany({
    where,
    include: { translations: true },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });

  const build = (parentId: string | null): NavNode[] =>
    menus
      .filter((m) => m.parentId === parentId)
      .map((m) => {
        const t = Object.fromEntries(m.translations.map((tr) => [tr.locale, tr]));
        return {
          id: m.id,
          parentId: m.parentId,
          icon: m.icon,
          path: m.path,
          permission: m.permission,
          sort: m.sort,
          isVisible: m.isVisible,
          isExternal: m.isExternal,
          target: m.target,
          platform: m.platform,
          brandId: m.brandId,
          name: t["zh"]?.name ?? "",
          enName: t["en"]?.name ?? "",
          children: build(m.id),
        };
      })
      .sort((a, b) => a.sort - b.sort);

  return build(null);
}

/** 递归收集某节点及所有子孙的 id（软删除用） */
export function collectSubtreeIds(id: string, nodes: { id: string; parentId: string | null }[]): string[] {
  const result: string[] = [];
  const walk = (pid: string) => {
    result.push(pid);
    for (const n of nodes) {
      if (n.parentId === pid) walk(n.id);
    }
  };
  walk(id);
  return result;
}
