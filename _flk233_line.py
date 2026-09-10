# -*- coding: utf-8 -*-
"""查 Fluke 233C 同系列产品"""
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.id, p.model, p."productLineId", pl.code as line,
              length(t."specsOverview") as spec_len
       FROM "Product" p
       LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."productLineId" = (
           SELECT "productLineId" FROM "Product" WHERE model ILIKE %s AND "brandId"=%s LIMIT 1
       )
       ORDER BY p.model''',
    ("%233%", "92c09b46-32f6-4425-bf3b-0bd4825da642"),
)
for r in cur.fetchall():
    print(f"  {r[1][:40]:<42} line={r[3]:<15} spec_len={r[4]}")
cur.close()
conn.close()
