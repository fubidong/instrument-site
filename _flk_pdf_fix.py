# -*- coding: utf-8 -*-
"""修复：只渲染实际规格表页面，排除目录页"""
import fitz, os, re, psycopg2

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
IMG_DIR = "E:/cxy/instrument-site/public/uploads/product/2026/flk/specs"
os.makedirs(IMG_DIR, exist_ok=True)

def is_toc_page(text):
    """判断是否是目录页（有大量......页码引用）"""
    dots = text.count('......') + text.count('……')
    lines_with_page = len(re.findall(r'\.\.\.+\s*\d+', text))
    return dots > 10 or lines_with_page > 5

def find_spec_pages(pdf_path):
    """找到实际规格表页面，排除目录页"""
    doc = fitz.open(pdf_path)
    spec_pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if is_toc_page(text):
            continue
        # 实际规格表：有"功能"+"量程"+"分辨率"+数值
        has_table = ("功能" in text and "量程" in text and "分辨率" in text and
                     re.search(r'\d+\.\d+\s*(V|A|Ω|Hz|F|°C)', text))
        # 一般技术指标
        has_general = (("一般技术指标" in text or "General Specifications" in text) and
                       re.search(r'(电池类型|Battery|尺寸|Weight|重量)', text) and
                       not is_toc_page(text))
        if has_table or has_general:
            spec_pages.append(i)
    doc.close()
    return spec_pages

def render_pdf_pages(pdf_path, pages, output_prefix):
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
cur.execute(
    """SELECT p.id, p.model, d."filePath" FROM "Product" p
       LEFT JOIN "Document" d ON d."productId"=p.id
       WHERE p."brandId"=%s AND p."isActive"=true AND d."filePath" IS NOT NULL
       ORDER BY p.model""",
    (BRAND,),
)
rows = cur.fetchall()

product_pdf = {}
for pid, model, filepath in rows:
    if pid not in product_pdf:
        product_pdf[pid] = (model, filepath)

print(f"有 PDF 的产品: {len(product_pdf)}")

# 先清空之前的 specsOverview（只清有 PDF 的产品，避免影响英文 v2 的）
for pid, (model, filepath) in product_pdf.items():
    pdf_path = os.path.join("E:/cxy/instrument-site/public", filepath.lstrip("/"))
    if not os.path.exists(pdf_path):
        continue
    pages = find_spec_pages(pdf_path)
    if not pages:
        continue
    prefix = re.sub(r'[^a-zA-Z0-9]', '_', model)[:40]
    try:
        urls = render_pdf_pages(pdf_path, pages, prefix)
    except Exception as e:
        continue
    html = "<div class='spec-pdf-images'>"
    for u in urls:
        html += f"<img src='{u}' style='width:100%;max-width:900px;display:block;margin:8px auto;border:1px solid #e2e8f0;border-radius:4px;'/>"
    html += "</div>"
    cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s', (html, pid, "zh"))
    cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s', (html, pid, "en"))

conn.commit()

# 统计
cur.execute(
    """SELECT COUNT(*) FROM "Product" p
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND p."isActive"=true AND t."specsOverview" IS NOT NULL AND length(t."specsOverview")>50""",
    (BRAND,),
)
has_spec = cur.fetchone()[0]
cur.execute(
    """SELECT COUNT(*) FROM "Product" p
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND p."isActive"=true AND t."specsOverview" LIKE '%spec-pdf-images%'""",
    (BRAND,),
)
pdf_spec = cur.fetchone()[0]
cur.close()
conn.close()
print(f"PDF规格图: {pdf_spec} 个产品")
print(f"总有规格: {has_spec}/395")
