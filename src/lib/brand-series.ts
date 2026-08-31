import { cache } from "react";
import { db } from "./db";
import { t } from "./site";

/** 系列下的型号（含参数高亮） */
export const getSeriesModels = cache(async (brandId: string, seriesCode: string) => {
  const line = await db.productLine.findFirst({
    where: { brandId, code: seriesCode, isActive: true },
    include: { translations: true },
  });
  if (!line) return { id: null, code: seriesCode, name: seriesCode, models: [] };

  const products = await db.product.findMany({
    where: { brandId, productLineId: line.id, isActive: true },
    include: {
      translations: true,
      paramValues: { include: { paramDefinition: { include: { translations: true } } } },
    },
    orderBy: [{ sortOrder: "asc" }, { model: "asc" }],
  });

  return {
    id: line.id,
    code: line.code,
    name: t(line.translations, "zh", "name") || line.code,
    models: products.map((p) => ({
      id: p.id,
      model: p.model,
      coverImage: p.coverImage,
      name: t(p.translations, "zh", "name") || p.model,
      highlights: p.paramValues
        .filter((pv) => pv.isHighlight)
        .slice(0, 3)
        .map((pv) => {
          const name = t(pv.paramDefinition.translations, "zh", "name") || pv.paramDefinition.key;
          const val = pv.valueString ?? (pv.valueBoolean ? "Yes" : "No");
          const unit = pv.paramDefinition.unit ? ` ${pv.paramDefinition.unit}` : "";
          return `${name}: ${val}${unit}`;
        }),
    })),
  };
});
