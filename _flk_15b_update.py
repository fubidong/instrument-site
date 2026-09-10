# -*- coding: utf-8 -*-
import psycopg2, uuid

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

# 读取规格 HTML
spec_html = open("E:/cxy/_15b_spec.html", encoding="utf-8").read()
overview = open("E:/cxy/_15b_overview.txt", encoding="utf-8").read()

# 找 15B MAX 产品
cur.execute("""SELECT id FROM "Product" WHERE "brandId"=%s AND model='Fluke 15B MAX'""", (BRAND,))
r = cur.fetchone()
if not r:
    print("未找到产品")
    exit()
pid = r[0]
print(f"产品 ID: {pid}")

# 更新 specsOverview（中英都用中文表格）
cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s', (spec_html, pid, "zh"))
cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s', (spec_html, pid, "en"))

# 更新 description（中文概述）
cur.execute('UPDATE "ProductTranslation" SET "description"=%s WHERE "productId"=%s AND locale=%s', (overview, pid, "zh"))

# 添加 datasheet 记录
doc_id = str(uuid.uuid4())
cur.execute(
    """INSERT INTO "Document" (id, "productId", title, "filePath", "docType", "createdAt", "updatedAt")
       VALUES (%s, %s, %s, %s, %s, NOW(), NOW())""",
    (doc_id, pid, "Fluke 15B MAX & 17B MAX 数字万用表 | 技术参数", "/uploads/docs/2026/FLK_15B_MAX_DS_CN.pdf", "datasheet"),
)
print(f"添加 datasheet: {doc_id}")

conn.commit()
cur.close()
conn.close()
print("15B MAX 更新完成")
