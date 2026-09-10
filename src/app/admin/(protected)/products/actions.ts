"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { resolveParamCategoryId } from "@/lib/params";

export type ProductFormState = {
  error?: string;
  success?: string;
  redirect?: string;
};

type ParamValueInput = {
  paramDefinitionId: string;
  valueNumber?: number | null;
  valueMin?: number | null;
  valueMax?: number | null;
  valueString?: string | null;
  valueBoolean?: boolean | null;
  isHighlight?: boolean | null;
};

/**
 * 清理富文本 HTML：空内容（仅空段落/换行/空格）转为 null
 */
function cleanHtml(html: string | null): string | null {
  if (!html) return null;
  const t = html.trim();
  if (!t) return null;
  if (/^(<p>(\s|&nbsp;)*<\/p>|<br\s*\/?>|&nbsp;|\s)*$/i.test(t)) return null;
  return t;
}

/**
 * 解析单条参数值（按参数类型）
 */
function parseParamValue(def: any, formData: FormData): ParamValueInput | null {
  const prefix = `param_${def.id}_`;
  const has = (name: string) => formData.get(prefix + name) !== null;
  const get = (name: string) => formData.get(prefix + name);

  const base: ParamValueInput = { paramDefinitionId: def.id };

  switch (def.type) {
    case "number":
    case "range": {
      if (def.type === "range") {
        const vMin = get("min");
        const vMax = get("max");
        if (!has("min") && !has("max")) return null;
        return {
          ...base,
          valueMin: vMin !== "" && vMin !== null ? parseFloat(vMin as string) : null,
          valueMax: vMax !== "" && vMax !== null ? parseFloat(vMax as string) : null,
          isHighlight: get("hl") === "on",
        };
      }
      const v = get("value");
      if (!has("value") || v === "") return null;
      return {
        ...base,
        valueNumber: parseFloat(v as string),
        isHighlight: get("hl") === "on",
      };
    }
    case "enum": {
      const v = get("value");
      if (!has("value") || v === "") return null;
      return { ...base, valueString: v as string };
    }
    case "boolean": {
      if (!has("value")) return null;
      return { ...base, valueBoolean: get("value") === "on" || get("value") === "true" };
    }
    case "string": {
      const v = get("value");
      if (!has("value") || v === "") return null;
      return { ...base, valueString: v as string };
    }
    default:
      return null;
  }
}

/**
 * 新增/更新产品（含参数值批量保存）
 */
export async function saveProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();

  const id = (formData.get("id") as string) || "";
  const productLineId = (formData.get("productLineId") as string) || "";
  const model = (formData.get("model") as string)?.trim() || "";
  const sku = (formData.get("sku") as string)?.trim() || "";
  const coverImage = (formData.get("coverImage") as string)?.trim() || "";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
  const isActive = formData.get("isActive") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const isSampleEnabled = formData.get("isSampleEnabled") === "on"; // 是否开启"申请样机"按钮

  const nameZh = (formData.get("name_zh") as string)?.trim() || "";
  const summaryZh = (formData.get("summary_zh") as string)?.trim() || "";
  const descriptionZh = cleanHtml(formData.get("description_zh") as string);
  const selectionZh = cleanHtml(formData.get("selection_zh") as string);
  const nameEn = (formData.get("name_en") as string)?.trim() || "";
  const summaryEn = (formData.get("summary_en") as string)?.trim() || "";
  const descriptionEn = cleanHtml(formData.get("description_en") as string);
  const selectionEn = cleanHtml(formData.get("selection_en") as string);
  const specsZh = cleanHtml(formData.get("specsOverview_zh") as string);
  const specsEn = cleanHtml(formData.get("specsOverview_en") as string);

  if (!productLineId) return { error: "请选择产品系列" };
  if (!model) return { error: "型号不能为空" };
  if (!nameZh && !nameEn) return { error: "产品名称不能为空（中文或英文至少填一个）" };
  // 名称兜底：只填一种语言时自动复用，避免缺某一语言名称导致保存失败
  const nameZhFinal = nameZh || nameEn;
  const nameEnFinal = nameEn || nameZh;

  const line = await db.productLine.findUnique({
    where: { id: productLineId },
    include: { category: true, brand: true },
  });
  if (!line) return { error: "产品系列不存在" };
  const brandId = line.brandId;
  const categoryId = line.categoryId;

  try {
    // 收集参数值（模板类别沿父级向上解析，与编辑页一致，避免查空导致参数被清空）
    const paramCatId = await resolveParamCategoryId(line.categoryId);
    const defs = await db.paramDefinition.findMany({
      where: { categoryId: paramCatId },
    });
    const paramValues: ParamValueInput[] = [];
    for (const def of defs) {
      const pv = parseParamValue(def, formData);
      if (pv) paramValues.push(pv);
    }

    if (id) {
      await db.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: {
            productLineId,
            brandId,
            categoryId,
            model,
            sku: sku || null,
            coverImage: coverImage || null,
            sortOrder,
            isActive,
            isFeatured,
            isSampleEnabled,
          },
        });
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: id, locale: "zh" } },
          create: {
            productId: id,
            locale: "zh",
            name: nameZhFinal,
            summary: summaryZh || null,
            description: descriptionZh || null,
            selection: selectionZh || null,
            specsOverview: specsZh || null,
          },
          update: {
            name: nameZhFinal,
            summary: summaryZh || null,
            description: descriptionZh || null,
            selection: selectionZh || null,
            specsOverview: specsZh || null,
          },
        });
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: id, locale: "en" } },
          create: {
            productId: id,
            locale: "en",
            name: nameEnFinal,
            summary: summaryEn || null,
            description: descriptionEn || null,
            selection: selectionEn || null,
            specsOverview: specsEn || null,
          },
          update: {
            name: nameEnFinal,
            summary: summaryEn || null,
            description: descriptionEn || null,
            selection: selectionEn || null,
            specsOverview: specsEn || null,
          },
        });
        // 删除旧参数值，重建（简单可靠）
        await tx.productParamValue.deleteMany({ where: { productId: id } });
        for (const pv of paramValues) {
          await tx.productParamValue.create({
            data: { ...pv, productId: id },
          });
        }
      });
    } else {
      await db.product.create({
        data: {
          productLineId,
          brandId,
          categoryId,
          model,
          sku: sku || null,
          coverImage: coverImage || null,
          sortOrder,
          isActive,
          isFeatured,
          isSampleEnabled,
          translations: {
            create: [
              {
                locale: "zh",
                name: nameZhFinal,
                summary: summaryZh || null,
                description: descriptionZh || null,
                selection: selectionZh || null,
                specsOverview: specsZh || null,
              },
              {
                locale: "en",
                name: nameEnFinal,
                summary: summaryEn || null,
                description: descriptionEn || null,
                selection: selectionEn || null,
                specsOverview: specsEn || null,
              },
            ],
          },
          paramValues: {
            create: paramValues,
          },
        },
      });
    }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "该型号已存在" };
    return { error: e?.message || "保存失败" };
  }

  revalidatePath("/admin/products");
  return { success: "保存成功", redirect: "/admin/products" };
}

/**
 * 删除产品（有关联询价/资料则拒绝）
 */
export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const product = await db.product.findUnique({
    where: { id },
    include: { _count: { select: { inquiries: true, documents: true } } },
  });
  if (!product) return;

  const count = product._count.inquiries + product._count.documents;
  if (count > 0) {
    throw new Error(`该产品有 ${count} 条询价/资料关联，无法删除。`);
  }

  await db.product.delete({ where: { id } });
  revalidatePath("/admin/products");
}

/**
 * 批量删除产品（跳过有关联的产品，返回结果）
 */
export async function batchDeleteProductsAction(formData: FormData) {
  await requireAdmin();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) return { error: "请选择产品" };

  const products = await db.product.findMany({
    where: { id: { in: ids } },
    include: { _count: { select: { inquiries: true, documents: true } } },
  });

  const deletable = products.filter(
    (p) => p._count.inquiries === 0 && p._count.documents === 0
  );
  const blocked = products.filter(
    (p) => p._count.inquiries > 0 || p._count.documents > 0
  );

  if (deletable.length > 0) {
    await db.product.deleteMany({ where: { id: { in: deletable.map((p) => p.id) } } });
  }
  revalidatePath("/admin/products");

  const msg = `已删除 ${deletable.length} 个产品`;
  return blocked.length > 0
    ? { success: msg, warning: `跳过 ${blocked.length} 个有关联的产品` }
    : { success: msg };
}

/**
 * 批量启用/停用产品
 */
export async function batchToggleProductsAction(formData: FormData) {
  await requireAdmin();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const isActive = formData.get("isActive") === "on";
  if (ids.length === 0) return { error: "请选择产品" };

  await db.product.updateMany({ where: { id: { in: ids } }, data: { isActive } });
  revalidatePath("/admin/products");
  return { success: `已${isActive ? "启用" : "停用"} ${ids.length} 个产品` };
}

/**
 * 复制产品（复制基本信息 + 参数值 + 翻译，新型号加后缀，跳转编辑）
 */
export async function duplicateProductAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const product = await db.product.findUnique({
    where: { id },
    include: { translations: true, paramValues: true },
  });
  if (!product) return { error: "产品不存在" };

  // 生成新型号：如 SDS1104X-E-copy
  let newModel = `${product.model}-copy`;
  let n = 1;
  while (await db.product.findUnique({ where: { model: newModel } })) {
    newModel = `${product.model}-copy${n}`;
    n++;
  }

  const newProduct = await db.product.create({
    data: {
      productLineId: product.productLineId,
      brandId: product.brandId,
      categoryId: product.categoryId,
      model: newModel,
      sku: product.sku ? `${product.sku}-copy` : null,
      coverImage: product.coverImage,
      sortOrder: product.sortOrder,
      isActive: false, // 复制品默认停用，避免误上线
      isFeatured: false,
      translations: {
        create: product.translations.map((t) => ({
          locale: t.locale,
          name: `${t.name} (复制)`,
          summary: t.summary,
          description: t.description,
          specsOverview: t.specsOverview,
        })),
      },
      paramValues: {
        create: product.paramValues.map((pv) => ({
          paramDefinitionId: pv.paramDefinitionId,
          valueNumber: pv.valueNumber,
          valueMin: pv.valueMin,
          valueMax: pv.valueMax,
          valueString: pv.valueString,
          valueBoolean: pv.valueBoolean,
          isHighlight: pv.isHighlight,
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  return { success: "已复制", redirect: `/admin/products/${newProduct.id}/edit` };
}

// ==================== 产品图库管理 ====================

export type GalleryActionResult = { error?: string; success?: string };

/** 新增图库图片（已通过 /api/upload 上传后拿到路径） */
export async function addProductImageAction(formData: FormData): Promise<GalleryActionResult> {
  await requireAdmin();
  const productId = (formData.get("productId") as string) || "";
  const imagePath = (formData.get("imagePath") as string)?.trim() || "";
  if (!productId || !imagePath) return { error: "参数错误" };

  const maxOrder = await db.productImage.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });
  await db.productImage.create({
    data: { productId, imagePath, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
  });
  revalidatePath(`/admin/products/${productId}/edit`);
  return { success: "已添加图片" };
}

/** 删除图库图片（仅移除记录，物理文件保留以防误删） */
export async function deleteProductImageAction(formData: FormData): Promise<GalleryActionResult> {
  await requireAdmin();
  const id = (formData.get("id") as string) || "";
  if (!id) return { error: "参数错误" };
  const img = await db.productImage.findUnique({ where: { id } });
  if (!img) return { error: "图片不存在" };
  await db.productImage.delete({ where: { id } });
  revalidatePath(`/admin/products/${img.productId}/edit`);
  return { success: "已删除" };
}

/** 调整图库图片排序（上移/下移） */
export async function moveProductImageAction(formData: FormData): Promise<GalleryActionResult> {
  await requireAdmin();
  const id = (formData.get("id") as string) || "";
  const direction = (formData.get("direction") as string) || "up"; // up | down
  if (!id) return { error: "参数错误" };

  const img = await db.productImage.findUnique({ where: { id } });
  if (!img) return { error: "图片不存在" };

  const siblings = await db.productImage.findMany({
    where: { productId: img.productId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = siblings.findIndex((s) => s.id === id);
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || target < 0 || target >= siblings.length) return { error: "已在边界" };

  const other = siblings[target];
  await db.$transaction([
    db.productImage.update({ where: { id }, data: { sortOrder: other.sortOrder } }),
    db.productImage.update({ where: { id: other.id }, data: { sortOrder: img.sortOrder } }),
  ]);
  revalidatePath(`/admin/products/${img.productId}/edit`);
  return { success: "已调整顺序" };
}

/** 设为封面图 */
export async function setCoverImageAction(formData: FormData): Promise<GalleryActionResult> {
  await requireAdmin();
  const productId = (formData.get("productId") as string) || "";
  const imagePath = (formData.get("imagePath") as string)?.trim() || "";
  if (!productId || !imagePath) return { error: "参数错误" };
  await db.product.update({ where: { id: productId }, data: { coverImage: imagePath } });
  revalidatePath(`/admin/products/${productId}/edit`);
  return { success: "已设为主图" };
}

// ==================== 产品规格书管理 ====================

export type SpecActionState = { error?: string; success?: string };

/** 添加规格书到产品：可传 docId（从系列复制）或 title+filePath（手动） */
export async function addProductSpecAction(formData: FormData): Promise<SpecActionState> {
  await requireAdmin();
  const productId = (formData.get("productId") as string) || "";
  if (!productId) return { error: "参数错误" };

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "产品不存在" };

  const docIds = formData.getAll("docId").map(String).filter(Boolean);
  if (docIds.length > 0) {
    const docs = await db.document.findMany({
      where: { id: { in: docIds }, docType: "datasheet" },
    });
    if (docs.length === 0) return { error: "未找到对应规格手册" };
    for (const d of docs) {
      const exists = await db.document.findFirst({
        where: { productId, title: d.title, filePath: d.filePath, docType: "datasheet" },
      });
      if (exists) continue;
      await db.document.create({
        data: {
          title: d.title,
          docType: "datasheet",
          filePath: d.filePath,
          productId,
          brandId: product.brandId,
          productLineId: product.productLineId,
        },
      });
    }
    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: `已添加 ${docs.length} 个规格书` };
  }

  const title = (formData.get("title") as string)?.trim() || "";
  const filePath = (formData.get("filePath") as string)?.trim() || "";
  if (!title || !filePath) return { error: "标题和 PDF 路径不能为空" };

  const exists = await db.document.findFirst({
    where: { productId, title, filePath, docType: "datasheet" },
  });
  if (exists) return { error: "该规格书已存在" };

  await db.document.create({
    data: {
      title,
      docType: "datasheet",
      filePath,
      productId,
      brandId: product.brandId,
      productLineId: product.productLineId,
    },
  });
  revalidatePath(`/admin/products/${productId}/edit`);
  return { success: "已添加规格书" };
}

/** 移除产品规格书（仅移除该产品级关联记录） */
export async function removeProductSpecAction(formData: FormData): Promise<SpecActionState> {
  await requireAdmin();
  const id = (formData.get("id") as string) || "";
  if (!id) return { error: "参数错误" };
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: "规格书不存在" };
  if (doc.productId && doc.docType === "datasheet") {
    await db.document.delete({ where: { id } });
  }
  revalidatePath(`/admin/products/${doc.productId}/edit`);
  return { success: "已移除" };
}