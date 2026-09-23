import { db } from "@/lib/db";
import CatalogAdminClient from "./catalog-admin-client";

export const dynamic = "force-dynamic";

export default async function CatalogAdminPage() {
  const tags = await db.catalogTag.findMany({ orderBy: { sortOrder: "asc" } });
  const info = await db.companyInfo.findMany();
  const mediaAssets = await db.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const brands = await db.brand.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { translations: { where: { locale: "zh" } } },
  });

  const infoObj: Record<string, string> = {};
  info.forEach((i: any) => (infoObj[i.key] = i.value));

  return (
    <CatalogAdminClient
      tags={tags.map((t: any) => ({ id: t.id, name: t.name, color: t.color, sortOrder: t.sortOrder }))}
      info={infoObj}
      mediaAssets={mediaAssets.map((m: any) => ({ id: m.id, url: m.url, name: m.originalName ?? m.filename }))}
    brands={brands.map((b: any) => ({
        id: b.id,
        name: b.translations[0]?.name ?? b.code,
        code: b.code,
        sortOrder: b.sortOrder,
        tags: b.tags ?? [],
      }))}
    />
  );
}
