# -*- coding: utf-8 -*-
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.model, pt.locale, length(pt."specsOverview") FROM "ProductTranslation" pt JOIN "Product" p ON p.id=pt."productId"
       WHERE p."brandId"=%s AND p.model ILIKE '%%287%%' ''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
rows = cur.fetchall()
print("287 products:", len(rows))
for r in rows:
    print(" ", r)
cur.close()
conn.close()
