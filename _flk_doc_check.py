# -*- coding: utf-8 -*-
"""检查福禄克文档类型与标题分布"""
import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    'SELECT d."docType", count(*) FROM "Document" d JOIN "Product" p ON p.id=d."productId" WHERE p."brandId"=%s GROUP BY d."docType"',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
print("docType counts:")
for t, c in cur.fetchall():
    print(" ", t, c)
cur.execute(
    'SELECT d.title FROM "Document" d JOIN "Product" p ON p.id=d."productId" WHERE p."brandId"=%s LIMIT 40',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
print("\nsample titles:")
for (t,) in cur.fetchall():
    print(" ", t)
cur.close()
conn.close()
