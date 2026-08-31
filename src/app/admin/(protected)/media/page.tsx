import { db } from "@/lib/db";
import MediaClient from "./media-client";

export const metadata = { title: "素材库" };

const CATEGORIES = [
  { value: "all", label: "全部分类" },
  { value: "product", label: "产品图片" },
  { value: "brand", label: "品牌 Logo" },
  { value: "doc", label: "资料文档" },
  { value: "news", label: "新闻配图" },
  { value: "other", label: "其他" },
];

const KINDS = [
  { value: "all", label: "全部类型" },
  { value: "image", label: "图片" },
  { value: "doc", label: "文档" },
];

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; category?: string; q?: string }>;
}) {
  const { kind, category, q } = await searchParams;

  const where: any = {};
  if (kind && kind !== "all") where.kind = kind;
  if (category && category !== "all") where.category = category;
  if (q?.trim()) {
    where.filename = { contains: q.trim(), mode: "insensitive" };
  }

  const [assets, counts] = await Promise.all([
    db.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    db.mediaAsset.groupBy({ by: ["kind"], _count: true }),
  ]);

  const kindCounts = {
    image: counts.find((c) => c.kind === "image")?._count ?? 0,
    doc: counts.find((c) => c.kind === "doc")?._count ?? 0,
  };
  const total = kindCounts.image + kindCounts.doc;

  return (
    <MediaClient
      assets={assets as any}
      total={total}
      kindCounts={kindCounts}
      currentKind={kind ?? "all"}
      currentCategory={category ?? "all"}
      currentQ={q ?? ""}
      categories={CATEGORIES}
      kinds={KINDS}
    />
  );
}
