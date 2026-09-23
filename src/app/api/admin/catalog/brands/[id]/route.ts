import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const tags = body.tags ? String(body.tags).split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  const brand = await db.brand.update({
    where: { id },
    data: { sortOrder: parseInt(body.sortOrder) || 0, tags },
  });
  return NextResponse.json(brand);
}
