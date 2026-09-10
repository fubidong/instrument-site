# -*- coding: utf-8 -*-
"""看 Fluke 12E+ / 部分紧凑 specsOverview 完整内容"""
import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.model, pt.locale, pt."specsOverview" FROM "ProductTranslation" pt
       JOIN "Product" p ON p.id=pt."productId"
       WHERE p."brandId"=%s AND p.model IN ('Fluke 12E+','Fluke 106','Fluke 115C','Fluke 175C')''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
for model, loc, spec in cur.fetchall():
    print("=====", model, loc, "len:", len(spec or ""))
    print((spec or "")[:1200])
    print()
cur.close()
conn.close()
