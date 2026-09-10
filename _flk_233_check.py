# -*- coding: utf-8 -*-
"""查 Fluke 233 文档 + 前台选项卡渲染条件"""
import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT d.id, d.title, d."docType", d."filePath" FROM "Document" d JOIN "Product" p ON p.id=d."productId"
       WHERE p."brandId"=%s AND p.model=%s ORDER BY d."docType"''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642", "Fluke 233"),
)
rows = cur.fetchall()
print("Fluke 233 docs:", len(rows))
for r in rows:
    print(" ", r)
cur.close()
conn.close()
