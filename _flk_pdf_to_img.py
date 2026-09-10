# -*- coding: utf-8 -*-
"""把福禄克 PDF 技术规格页渲染成图片，放入 specsOverview"""
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
        # 精度规格表的特征：有"功能"+"量程"+"分辨率"+精度列
        if ("功能" in text and "量程" in text and "分辨率" in text) or \
           ("Function" in text and "Range" in text and "Resolution" in text):
            spec_pages.append(i)
        # 一般技术指标页
        elif ("一般技术指标" in text or "General Specifications" in text) and \
             ("电池类型" in text or "Battery" in text or "尺寸" in text):
            spec_pages.append(i)
    doc.close()
    return spec_pages

def render_pdf_pages(pdf_path, pages, output_prefix):
    """把指定页面渲染成 PNG，返回 URL 列表"""
    doc = fitz.open(pdf_path)
    urls = []
    for idx, page_num in enumerate(pages):
        page = doc[page_num]
        # 高分辨率渲染
        mat = fitz.Matrix(2, 2)  # 2x zoom
        pix = page.get_pixmap(matrix=mat)
        out_path = os.path.join(IMG_DIR, f"{output_prefix}_{idx+1}.png")
        pix.save(out_path)
        urls.append(f"/uploads/product/2026/flk/specs/{output_prefix}_{idx+1}.png")
    doc.close()
    return urls

# 获取所有福禄克产品
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.id, p.model, d."filePath" FROM "Product" p
       LEFT JOIN "Document" d ON d."productId"=p.id AND d."docType"='datasheet'
       WHERE p."brandId"=%s AND p."isActive"=true''',
    (BRAND,),
)
products = cur.fetchall()
print(f"福禄克产品: {len(products)}")

# 测试 15B MAX
for pid, model, filepath in products:
    if "15B" in model and "MAX" in model:
        print(f"\n处理: {model}")
        print(f"  PDF: {filepath}")
        if filepath:
            pdf_path = os.path.join("E:/cxy/instrument-site/public", filepath.lstrip('/'))
            if os.path.exists(pdf_path):
                pages = find_spec_pages(pdf_path)
                print(f"  规格页: {pages}")
                if pages:
                    prefix = re.sub(r'[^a-zA-Z0-9]', '_', model)
                    urls = render_pdf_pages(pdf_path, pages, prefix)
                    print(f"  图片: {urls}")
                    # 生成 HTML
                    html = "<div class='spec-pdf-images'>"
                    for u in urls:
                        html += f"<img src='{u}' style='width:100%;max-width:900px;display:block;margin:8px auto;border:1px solid #e2e8f0;border-radius:4px;'/>"
                    html += "</div>"
                    # 更新 DB
                    cur.execute(
                        'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
                        (html, pid, "zh"),
                    )
                    cur.execute(
                        'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
                        (html, pid, "en"),
                    )
                    conn.commit()
                    print(f"  已更新 specsOverview")
        break

cur.close()
conn.close()
print("\n测试完成")
