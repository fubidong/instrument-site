import { db } from "@/lib/db";
import DocumentForm from "../document-form";

async function getFormOptions() {
  const [brands, productLines] = await Promise.all([
    db.brand.findMany({
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.productLine.findMany({
      include: {
        translations: true,
        brand: { include: { translations: true } },
        category: { include: { translations: true } },
      },
      orderBy: [{ brand: { code: "asc" } }, { sortOrder: "asc" }],
    }),
  ]);

  const brandOptions = brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return { id: b.id, zhName: t["zh"]?.name ?? b.code, enName: t["en"]?.name ?? "" };
  });
  const lineOptions = productLines.map((l) => {
    const lt = Object.fromEntries(l.translations.map((tr) => [tr.locale, tr]));
    const bt = Object.fromEntries(l.brand.translations.map((tr) => [tr.locale, tr]));
    const ct = Object.fromEntries(l.category.translations.map((tr) => [tr.locale, tr]));
    return {
      id: l.id,
      label: `${bt["zh"]?.name ?? l.brand.code} / ${ct["zh"]?.name ?? l.category.code} / ${lt["zh"]?.name ?? l.code} (${l.code})`,
      brandId: l.brandId,
      categoryZh: ct["zh"]?.name ?? l.category.code,
    };
  });

  return { brandOptions, lineOptions };
}

export default async function NewDocumentPage() {
  const { brandOptions, lineOptions } = await getFormOptions();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">新增资料</h1>
      <DocumentForm doc={null} brands={brandOptions} productLines={lineOptions} />
    </div>
  );
}
