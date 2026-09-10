# -*- coding: utf-8 -*-
"""把福禄克 PDF 技术规格页渲染成图片，批量更新 specsOverview"""
import fitz, os, re, psycopg2

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
PDF_DIR = "E:/cxy/instrument-site/public/uploads/docs/2026"
IMG_DIR = "E:/cxy/instrument-site/public/uploads/product/2026/flk/specs"
os.makedirs(IMG_DIR, exist_ok=True)

def find_spec_pages(pdf_path):
    """找到包含技术规格表的页面索引"""
    doc = fitz.open(pdf_path)
    spec_pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        # 精度规格表
        if ("功能" in text and "量程" in text and "分辨率" in text) or \
           ("Function" in text and "Range" in text and "Resolution" in text):
            spec_pages.append(i)
        # 一般技术指标
        elif ("一般技术指标" in text or "General Specifications" in text) and \
             ("电池" in text or "Battery" in text or "尺寸" in text or "Weight" in text):
            spec_pages.append(i)
    doc.close()
    return spec_pages

def render_pdf_pages(pdf_path, pages, output_prefix):
    """把指定页面渲染成 PNG，返回 URL 列表"""
    doc = fitz.open(pdf_path)
    urls = []
    for idx, page_num in enumerate(pages):
        page = doc[page_num]
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)
        out_path = os.path.join(IMG_DIR, f"{output_prefix}_{idx+1}.png")
        pix.save(out_path)
        urls.append(f"/uploads/product/2026/flk/specs/{output_prefix}_{idx+1}.png")
    doc.close()
    return urls

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

# 获取所有福禄克产品及其 PDF（优先 datasheet，其次 user_manual）
cur.execute(
    """SELECT p.id, p.model, d."filePath", d."docType"
       FROM "Product" p
       LEFT JOIN "Document" d ON d."productId"=p.id
       WHERE p."brandId"=%s AND p."isActive"=true
       ORDER BY p.model""",
    (BRAND,),
)
rows = cur.fetchall()

# 每个产品只取一个 PDF（优先 datasheet）
product_pdf = {}
for pid, model, filepath, doctype in rows:
    if not filepath:
        continue
    if pid not in product_pdf or doctype == "datasheet":
        product_pdf[pid] = (model, filepath, doctype)

print(f"有 PDF 的产品: {len(product_pdf)}")

updated = 0
no_spec = 0
for pid, (model, filepath, doctype) in product_pdf.items():
    pdf_path = os.path.join("E:/cxy/instrument-site/public", filepath.lstrip("/"))
    if not os.path.exists(pdf_path):
        continue

    pages = find_spec_pages(pdf_path)
    if not pages:
        no_spec += 1
        continue

    prefix = re.sub(r'[^a-zA-Z0-9]', '_', model)[:40]
    try:
        urls = render_pdf_pages(pdf_path, pages, prefix)
    except Exception as e:
        print(f"  渲染失败 {model}: {e}")
        continue

    html = "<div class='spec-pdf-images'>"
    for u in urls:
        html += f"<img src='{u}' style='width:100%;max-width:900px;display:block;margin:8px auto;border:1px solid #e2e8f0;border-radius:4px;'/>"
    html += "</div>"

    cur.execute(
        'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
        (html, pid, "zh"),
    )
    cur.execute(
        'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
        (html, pid, "en"),
    )
    updated += 1
    if updated % 20 == 0:
        print(f"  已处理 {updated}...")

conn.commit()

# 统计
cur.execute(
    """SELECT COUNT(*) FROM "Product" p
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND p."isActive"=true AND t."specsOverview" IS NOT NULL AND length(t."specsOverview")>50""",
    (BRAND,),
)
has_spec = cur.fetchone()[0]
cur.close()
conn.close()

print(f"\n更新: {updated} 个产品（PDF规格图）")
print(f"无规格页: {no_spec} 个")
print(f"当前有规格: {has_spec}/395")
