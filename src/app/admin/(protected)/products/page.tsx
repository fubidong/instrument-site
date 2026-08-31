import Link from "next/link";
import { db } from "@/lib/db";
import ProductsTable from "./products-table";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; category?: string; line?: string; status?: string; q?: string }>;
}) {
  const { brand, category, line, status, q } = await searchParams;

  const where: any = {};
  if (brand && brand !== "all") where.brandId = brand;
  if (category && category !== "all") where.categoryId = category;
  if (line && line !== "all") where.productLineId = line;
  if (status && status !== "all") where.isActive = status === "active";
  if (q?.trim()) {
    where.OR = [
      { model: { contains: q.trim(), mode: "insensitive" } },
      { translations: { some: { name: { contains: q.trim(), mode: "insensitive" } } } },
    ];
  }

  const [products, brands, categories, lines] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        productLine: {
          include: { translations: true, brand: { include: { translations: true } } },
        },
        translations: true,
      },
      orderBy: [{ productLine: { code: "asc" } }, { sortOrder: "asc" }, { model: "asc" }],
    }),
    db.brand.findMany({
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.category.findMany({
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.productLine.findMany({
      include: { translations: true, brand: { include: { translations: true } } },
      orderBy: [{ brand: { code: "asc" } }, { sortOrder: "asc" }],
    }),
  ]);

  const brandOptions = brands.map((b) => {
    const t = Object.fromEntries(b.translations.map((tr) => [tr.locale, tr]));
    return { id: b.id, label: t["zh"]?.name ?? b.code };
  });
  const categoryOptions = categories.map((c) => {
    const t = Object.fromEntries(c.translations.map((tr) => [tr.locale, tr]));
    return { id: c.id, label: t["zh"]?.name ?? c.code };
  });
  const lineOptions = lines.map((l) => {
    const lt = Object.fromEntries(l.translations.map((tr) => [tr.locale, tr]));
    const bt = Object.fromEntries(l.brand.translations.map((tr) => [tr.locale, tr]));
    return { id: l.id, label: `${bt["zh"]?.name ?? l.brand.code} / ${lt["zh"]?.name ?? l.code}`, code: l.code };
  });

  return (
    <ProductsTable
      products={products as any}
      brandOptions={brandOptions}
      categoryOptions={categoryOptions}
      lineOptions={lineOptions}
      currentBrand={brand ?? "all"}
      currentCategory={category ?? "all"}
      currentLine={line ?? "all"}
      currentStatus={status ?? "all"}
      currentQ={q ?? ""}
    />
  );
}
