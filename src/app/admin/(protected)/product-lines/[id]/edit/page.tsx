import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductLineForm from "../../product-line-form";

export default async function EditProductLinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [line, brands, categories] = await Promise.all([
    db.productLine.findUnique({ where: { id }, include: { translations: true } }),
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
  if (!line) notFound();

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">编辑系列 · {line.code}</h1>
        <Link href="/admin/product-lines" className="text-sm text-sky-600 hover:underline">
          ← 返回系列列表
        </Link>
      </div>
      <ProductLineForm line={line} brands={brandOptions} categories={categoryOptions} />
    </div>
  );
}
