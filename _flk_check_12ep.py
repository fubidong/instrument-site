# -*- coding: utf-8 -*-
"""查 Fluke 12E+ spec 渲染内容"""
import sys, psycopg2
sys.path.insert(0, ".")
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT pt."specsOverview" FROM "ProductTranslation" pt JOIN "Product" p ON p.id=pt."productId"
       WHERE p."brandId"=%s AND p.model='Fluke 12E+' AND pt.locale='zh' ''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
r = cur.fetchone()
cur.close()
conn.close()
s = r[0] if r else ""
print("len:", len(s))
print(s[:900])
