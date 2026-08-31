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
  searchParams: Promise<{ kind?: string; category?: string; q?: string; folder?: string }>;
}) {
  const { kind, category, q, folder } = await searchParams;

  const where: any = {};
  if (kind && kind !== "all") where.kind = kind;
  if (category && category !== "all") where.category = category;
  if (q?.trim()) {
    where.filename = { contains: q.trim(), mode: "insensitive" };
  }
  const folderId = folder || null;
  // 素材库当前文件夹视图：folder 存在时只显示该文件夹内素材；无 folder 时显示全部
  // （注意：全部素材视图包含所有，含已归类的）
  if (folderId) where.folderId = folderId;

  const [assets, counts, allFolders, folderCounts] = await Promise.all([
    db.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    db.mediaAsset.groupBy({ by: ["kind"], _count: true }),
    db.mediaFolder.findMany({ orderBy: { createdAt: "asc" } }),
    db.mediaAsset.groupBy({ by: ["folderId"], _count: true }),
  ]);

  const kindCounts = {
    image: counts.find((c) => c.kind === "image")?._count ?? 0,
    doc: counts.find((c) => c.kind === "doc")?._count ?? 0,
  };
  const total = kindCounts.image + kindCounts.doc;

  const countMap = new Map(folderCounts.map((c) => [c.folderId, c._count]));
  const folders = allFolders.map((f) => ({
    id: f.id,
    name: f.name,
    parentId: f.parentId,
    assetCount: countMap.get(f.id) ?? 0,
  }));

  return (
    <MediaClient
      assets={assets as any}
      total={total}
      kindCounts={kindCounts}
      currentKind={kind ?? "all"}
      currentCategory={category ?? "all"}
      currentQ={q ?? ""}
      currentFolderId={folderId}
      categories={CATEGORIES}
      kinds={KINDS}
      folders={folders}
    />
  );
}
