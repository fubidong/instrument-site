# -*- coding: utf-8 -*-
"""统计福禄克无文档产品"""
import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.model, (SELECT count(*) FROM "Document" d WHERE d."productId"=p.id) AS dc
       FROM "Product" p WHERE p."brandId"=%s AND p."isActive"=true ORDER BY p.model''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
rows = cur.fetchall()
total = len(rows)
with_doc = sum(1 for _, c in rows if c > 0)
no_doc = [(m, c) for m, c in rows if c == 0]
print("active products:", total, "| with docs:", with_doc, "| no docs:", len(no_doc))
print("\nproducts without docs:")
for m, c in no_doc:
    print(" ", m)
cur.close()
conn.close()
