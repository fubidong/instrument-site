# -*- coding: utf-8 -*-
"""查福禄克 DB 产品 model 命名规律"""
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.model FROM "Product" p WHERE p."brandId"=%s AND p."isActive"=true ORDER BY p.model''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
rows = [r[0] for r in cur.fetchall()]
cur.close()
conn.close()
print("total:", len(rows))
for m in rows[:40]:
    print(" ", m)
print("...")
for m in rows[-10:]:
    print(" ", m)
