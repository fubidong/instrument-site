import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import InquiriesClient from "./inquiries-client";

export const metadata = { title: "询价线索" };

const VALID_STATUS = ["pending", "quoted", "closed_won", "closed_lost"];

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const where: any = {};
  if (sp.status && VALID_STATUS.includes(sp.status)) where.status = sp.status;
  if (sp.q?.trim()) {
    const kw = sp.q.trim();
    where.OR = [
      { name: { contains: kw, mode: "insensitive" } },
      { company: { contains: kw, mode: "insensitive" } },
      { contact: { contains: kw, mode: "insensitive" } },
      { email: { contains: kw, mode: "insensitive" } },
      { message: { contains: kw, mode: "insensitive" } },
    ];
  }

  const inquiries = await db.inquiry.findMany({
    where,
    include: { product: { select: { model: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = inquiries.map((i) => ({
    id: i.id,
    name: i.name,
    company: i.company,
    contact: i.contact,
    email: i.email,
    country: i.country,
    message: i.message,
    status: i.status,
    adminNote: i.adminNote,
    sourceIp: i.sourceIp,
    createdAt: i.createdAt.toISOString(),
    product: i.product,
  }));

  const statusLabel: Record<string, string> = {
    pending: "待处理",
    quoted: "已报价",
    closed_won: "已成交",
    closed_lost: "已关闭",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">询价线索</h1>
          <p className="mt-1 text-sm text-slate-500">
            查看前台提交的询价与留言，跟进处理 · 共 {inquiries.length} 条
          </p>
        </div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回仪表盘
        </Link>
      </div>
      <InquiriesClient rows={rows} />
    </div>
  );
}
