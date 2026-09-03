import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * 全局型号搜索 API：按型号模糊匹配启用产品，返回下拉建议数据
 * /api/search?q=SDS&locale=zh
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const locale = (req.nextUrl.searchParams.get("locale") as "zh" | "en") ?? "zh";
  if (q.length < 1) return NextResponse.json({ items: [] });

  const products = await db.product.findMany({
    where: { isActive: true, model: { contains: q, mode: "insensitive" } },
    select: {
      model: true,
      coverImage: true,
      brand: {
        select: {
          code: true,
          translations: { where: { locale }, select: { name: true } },
        },
      },
      productLine: {
        select: {
          code: true,
          translations: { where: { locale }, select: { name: true } },
        },
      },
    },
    orderBy: [{ brandId: "asc" }, { model: "asc" }],
    take: 8,
  });

  const items = products.map((p) => ({
    model: p.model,
    coverImage: p.coverImage,
    brandCode: p.brand.code,
    brandName: p.brand.translations[0]?.name || p.brand.code,
    seriesName: p.productLine.translations[0]?.name || p.productLine.code,
  }));

  return NextResponse.json({ items });
}
