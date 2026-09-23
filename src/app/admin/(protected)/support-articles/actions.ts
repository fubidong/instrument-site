"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type SupportArticleFormState = {
  error?: string;
  success?: string;
  redirect?: string;
};

const TYPES = ["solution", "tech", "faq"] as const;
type Type = (typeof TYPES)[number];

function parsePublishedAt(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * 新增/更新支持中心文章（SupportArticle + zh/en 两条 translation）
 * 支持多选关联素材库 PDF（每个 PDF 独立：直接下载/获客模式）与多选关联商品
 */
export async function saveSupportArticleAction(
  _prev: SupportArticleFormState,
  formData: FormData
): Promise<SupportArticleFormState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const typeRaw = (formData.get("type") as string) || "tech";
  const type = (TYPES as readonly string[]).includes(typeRaw) ? (typeRaw as Type) : "tech";
  const brandId = (formData.get("brandId") as string) || "";
  const coverImage = (formData.get("coverImage") as string)?.trim() || "";
  const sourceUrl = (formData.get("sourceUrl") as string)?.trim() || "";
  const sortOrder = formData.get("sortOrder") ? parseInt(formData.get("sortOrder") as string) : 0;
  const publishedAt = parsePublishedAt((formData.get("publishedAt") as string) || "");
  const isPublished = formData.get("isPublished") === "on";

  // PDF 多选：hidden JSON，形如 [{pdfAssetId, pdfMode}]
  let pdfRows: { pdfAssetId: string; pdfMode: string }[] = [];
  try {
    const raw = (formData.get("pdfLinks") as string) || "[]";
    pdfRows = JSON.parse(raw);
  } catch {
    return { error: "PDF 关联数据解析失败，请重试" };
  }

  // 商品多选：hidden JSON，型号数组 ["IT6000C","UT139C"]
  let productModels: string[] = [];
  try {
    const raw = (formData.get("productModels") as string) || "[]";
    productModels = JSON.parse(raw);
  } catch {
    return { error: "商品关联数据解析失败，请重试" };
  }

  // 校验商品型号存在
  const modelList = productModels.map((m) => m.trim()).filter(Boolean);
  const missing: string[] = [];
  for (const m of modelList) {
    const found = await db.product.findUnique({ where: { model: m }, select: { id: true } });
    if (!found) missing.push(m);
  }
  if (missing.length) {
    return { error: `以下型号未找到，请从下拉中选择：${missing.join("、")}` };
  }

  const zhTitle = (formData.get("zhTitle") as string)?.trim() || "";
  const enTitle = (formData.get("enTitle") as string)?.trim() || "";
  const zhSummary = (formData.get("zhSummary") as string) || "";
  const enSummary = (formData.get("enSummary") as string) || "";
  const zhContent = (formData.get("zhContent") as string) || "";
  const enContent = (formData.get("enContent") as string) || "";

  if (!zhTitle && !enTitle) return { error: "中文标题与英文标题至少填写一个" };

  const articleData = {
    type,
    brandId: brandId || null,
    coverImage: coverImage || null,
    sourceUrl: sourceUrl || null,
    isPublished,
    publishedAt,
    sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
  };

  try {
    let articleId = id;
    if (id) {
      await db.supportArticle.update({ where: { id }, data: articleData });
    } else {
      const created = await db.supportArticle.create({ data: articleData });
      articleId = created.id;
    }

    // translation：先删后插 zh/en（幂等）
    await db.supportArticleTranslation.deleteMany({ where: { articleId } });
    await db.supportArticleTranslation.createMany({
      data: [
        {
          articleId,
          locale: "zh",
          title: zhTitle || enTitle,
          summary: zhSummary || null,
          content: zhContent || null,
        },
        {
          articleId,
          locale: "en",
          title: enTitle || zhTitle,
          summary: enSummary || null,
          content: enContent || null,
        },
      ],
    });

    // PDF 关联：先删后插
    await db.supportArticlePdf.deleteMany({ where: { articleId } });
    const pdfData = pdfRows
      .filter((r) => r.pdfAssetId)
      .map((r) => ({
        articleId,
        pdfAssetId: r.pdfAssetId,
        pdfMode: r.pdfMode === "lead" ? "lead" : "download",
      }));
    if (pdfData.length) await db.supportArticlePdf.createMany({ data: pdfData });

    // 商品关联：先删后插
    await db.supportArticleProduct.deleteMany({ where: { articleId } });
    const prodIds: string[] = [];
    for (const m of modelList) {
      const found = await db.product.findUnique({ where: { model: m }, select: { id: true } });
      if (found) prodIds.push(found.id);
    }
    await db.supportArticleProduct.createMany({
      data: prodIds.map((pid) => ({ articleId, productId: pid })),
    });
  } catch (e: any) {
    return { error: e?.message || "保存失败" };
  }

  revalidatePath("/admin/support-articles");
  revalidatePath("/[locale]/support", "page");
  return { success: "保存成功", redirect: "/admin/support-articles" };
}

/**
 * 删除支持中心文章（级联删除 translation / PDF / 商品关联）
 */
export async function deleteSupportArticleAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await db.supportArticle.delete({ where: { id } });
  revalidatePath("/admin/support-articles");
  revalidatePath("/[locale]/support", "page");
}
