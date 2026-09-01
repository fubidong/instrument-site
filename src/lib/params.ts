import { db } from "@/lib/db";

/**
 * 解析参数模板所属分类：从给定分类沿父级向上回溯，
 * 返回第一个存在 ParamDefinition 的分类 id。
 * 产品/系列可能挂在品牌子分类（如 SIGLENT-DIGITAL-OSC），
 * 而参数模板定义在品牌父分类（如 SIGLENT-OSCILLOSCOPE）。
 */
export async function resolveParamCategoryId(categoryId: string): Promise<string> {
  const visited = new Set<string>();
  let cur: string | null = categoryId;
  while (cur && !visited.has(cur)) {
    visited.add(cur);
    const count = await db.paramDefinition.count({ where: { categoryId: cur } });
    if (count > 0) return cur;
    const cat = await db.category.findUnique({
      where: { id: cur },
      select: { parentId: true },
    });
    cur = cat?.parentId ?? null;
  }
  return categoryId;
}
