import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// PUT: 修改名称/排序
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();
  if (body.name) {
    const t = await db.categoryTranslation.findFirst({ where: { categoryId: id, locale: "zh" } });
    if (t) await db.categoryTranslation.update({ where: { id: t.id }, data: { name: body.name } });
    else await db.categoryTranslation.create({ data: { categoryId: id, locale: "zh", name: body.name } });
  }
  if (typeof body.sortOrder === "number") {
    await db.category.update({ where: { id }, data: { sortOrder: body.sortOrder } });
  }
  return NextResponse.json({ ok: true });
}

// DELETE: 删除
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  await db.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
