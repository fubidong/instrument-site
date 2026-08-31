import { db } from "@/lib/db";
import ProductLineForm from "../product-line-form";

export default async function NewProductLinePage() {
  const [brands, categories] = await Promise.all([
    db.brand.findMany({
      where: { isActive: true },
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.category.findMany({
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const brandOptions = brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return { id: b.id, zhName: t["zh"]?.name ?? b.code, enName: t["en"]?.name ?? "" };
  });
  const categoryOptions = categories.map((c) => {
    const t = Object.fromEntries(c.translations.map((tr) => [tr.locale, tr]));
    return { id: c.id, zhName: t["zh"]?.name ?? c.code, enName: t["en"]?.name ?? "" };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">新增产品系列</h1>
      <ProductLineForm line={null} brands={brandOptions} categories={categoryOptions} />
    </div>
  );
}
