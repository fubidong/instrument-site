import { cache } from "react";
import { db } from "./db";
import { t } from "./site";

/** 分类详情：系列列表 + 每系列的型号 + 参数对比（含全部参数键） */
export const getBrandCategoryDetail = cache(
  async (brandId: string, categoryIds: string[], locale: string = "zh") => {
    // 1. 系列
    const lines = await db.productLine.findMany({
      where: { brandId, categoryId: { in: categoryIds }, isActive: true },
      include: {
        translations: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { sortOrder: "asc" },
    });

    const result = [];
    for (const line of lines) {
      if (line._count.products === 0) continue;
      // 2. 型号
      const products = await db.product.findMany({
        where: { brandId, productLineId: line.id, isActive: true },
        include: {
          translations: true,
          paramValues: { include: { paramDefinition: { include: { translations: true } } } },
        },
        orderBy: [{ sortOrder: "asc" }, { model: "asc" }],
      });
      // 3. 汇总所有参数定义（该系列型号涉及的），作为对比列
      const keyMap = new Map<string, { id: string; name: string; unit: string | null }>();
      for (const p of products) {
        for (const pv of p.paramValues) {
          const def = pv.paramDefinition;
          if (!keyMap.has(def.id)) {
            keyMap.set(def.id, {
              id: def.id,
              name: t(def.translations, locale, "name") || t(def.translations, "zh", "name") || def.key,
              unit: def.unit,
            });
          }
        }
      }
      const compareKeys = [...keyMap.values()].slice(0, 8); // 最多 8 个参数列

      result.push({
        id: line.id,
        code: line.code,
        name: t(line.translations, "zh", "name") || line.code,
        models: products.map((p) => ({
          id: p.id,
          model: p.model,
          coverImage: p.coverImage,
          params: Object.fromEntries(
            p.paramValues.map((pv) => [
              pv.paramDefinitionId,
              pv.valueString ?? (pv.valueBoolean ? "Yes" : "No"),
            ])
          ),
        })),
        compareKeys,
      });
    }
    return result;
  }
);
