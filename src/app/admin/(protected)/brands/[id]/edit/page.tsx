import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BrandForm from "../../brand-form";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await db.brand.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!brand) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">编辑品牌</h1>
          <p className="mt-1 text-sm text-slate-500">
            {brand.code}（创建于 {brand.createdAt.toLocaleDateString("zh-CN")}）
          </p>
        </div>
        <Link href="/admin/brands" className="text-sm text-sky-600 hover:underline">
          ← 返回列表
        </Link>
      </div>
      <BrandForm brand={brand} />
    </div>
  );
}
