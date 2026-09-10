# -*- coding: utf-8 -*-
"""查 Fluke 233 相关产品 model 差异"""
import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.id, p.model, p."productLineId", pl.code FROM "Product" p
       LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
       WHERE p."brandId"=%s AND (p.model ILIKE '%%233%%' OR p.id='67ddfe58-066e-44e3-b9c9-256a368432f1')''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
rows = cur.fetchall()
print("products like 233:")
for r in rows:
    print(" ", r)
cur.close()
conn.close()
