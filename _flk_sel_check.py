# -*- coding: utf-8 -*-
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    """SELECT t.selection FROM "Product" p JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh' WHERE p.model='Fluke 15B MAX'"""
)
r = cur.fetchone()
if r and r[0]:
    print(r[0][:1000])
else:
    print("无 selection")
cur.close()
conn.close()
