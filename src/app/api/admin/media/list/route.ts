import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || "image";
  const take = parseInt(searchParams.get("take") || "100");

  const assets = await db.mediaAsset.findMany({
    where: { kind },
    select: { id: true, path: true, filename: true },
    orderBy: { createdAt: "desc" },
    take,
  });

  // 把 path 映射成 url 返回，兼容前端组件
  const result = assets.map(a => ({
    id: a.id,
    url: a.path,
    filename: a.filename,
  }));

  return NextResponse.json({ assets: result });
}
