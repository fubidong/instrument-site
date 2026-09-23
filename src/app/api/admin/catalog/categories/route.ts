import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// GET: 列表（全站品类 brandId=null）
export async function GET() {
  await requireAdmin();
  const cats = await db.category.findMany({
    where: { brandId: null },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });
  return NextResponse.json(
    cats.map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.translations[0]?.name ?? c.code,
      sortOrder: c.sortOrder,
    }))
  );
}

// POST: 新增
export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json();
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "名称必填" }, { status: 400 });
  const code = "CAT_" + Date.now().toString(36).toUpperCase();
  const c = await db.category.create({
    data: {
      code,
      sortOrder: body.sortOrder ?? 0,
      translations: { create: { locale: "zh", name } },
    },
  });
  return NextResponse.json({ ok: true, id: c.id });
}
