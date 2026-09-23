import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const tag = await db.catalogTag.update({
    where: { id },
    data: { name: body.name, color: body.color, sortOrder: parseInt(body.sortOrder) },
  });
  return NextResponse.json(tag);
}
