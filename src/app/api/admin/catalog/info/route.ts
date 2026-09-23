import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await db.companyInfo.upsert({
      where: { key: key as string },
      update: { value: value as string },
      create: { key: key as string, value: value as string },
    });
  }
  return NextResponse.json({ ok: true });
}
