# -*- coding: utf-8 -*-
"""查 Fluke 233 前台 specsOverview 原始内容"""
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.id, p.model, t."specsOverview"
       FROM "Product" p
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND p.model ILIKE %s''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642", "%233%"),
)
for r in cur.fetchall():
    print("=== model:", r[1])
    print("id:", r[0])
    spec = r[2] or ""
    print("spec len:", len(spec))
    print(spec[:1500])
    print("...")
cur.close()
conn.close()
