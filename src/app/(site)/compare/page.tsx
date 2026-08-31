import { db } from "@/lib/db";
import CompareTable from "./compare-table";
import CompareHydrator from "./compare-hydrator";

export const metadata = { title: "产品对比" };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const sp = await searchParams;
  const ids = sp.ids?.split(",").filter(Boolean) ?? [];

  let products: any[] = [];
  if (ids.length > 0) {
    products = await db.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: {
        translations: true,
        productLine: {
          include: { brand: { include: { translations: true } }, translations: true },
        },
        paramValues: {
          include: { paramDefinition: { include: { translations: true } } },
          orderBy: { paramDefinition: { sortOrder: "asc" } },
        },
      },
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <CompareHydrator />
      <h1 className="text-2xl font-bold text-slate-900">产品对比</h1>
      <p className="mt-2 text-sm text-slate-500">
        在产品详情页点击"加入对比"，最多选择 5 个产品进行参数横向对比。
      </p>

      {products.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center">
          <p className="text-slate-500">还没有选择对比的产品</p>
          <p className="mt-2 text-sm text-slate-400">请先在产品详情页点击"加入对比"</p>
          <a
            href="/products"
            className="mt-6 inline-block rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
          >
            去浏览产品
          </a>
        </div>
      ) : (
        <CompareTable products={products} />
      )}
    </div>
  );
}
