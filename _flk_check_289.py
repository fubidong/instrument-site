# -*- coding: utf-8 -*-
"""验证 Fluke 289 DB spec 已三列化"""
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT pt."specsOverview" FROM "ProductTranslation" pt JOIN "Product" p ON p.id=pt."productId"
       WHERE p."brandId"=%s AND p.model='Fluke 289' AND pt.locale='zh' ''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
r = cur.fetchone()
cur.close()
conn.close()
s = r[0] if r else ""
print("len:", len(s))
print("spec-3col" in s)
print(s[:700])
