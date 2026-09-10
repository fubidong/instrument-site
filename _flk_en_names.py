# -*- coding: utf-8 -*-
"""查福禄克 DB 产品英文 name，用于匹配 JSON slug"""
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.id, p.model, t.name as en_name
       FROM "Product" p
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='en'
       WHERE p."brandId"=%s AND p."isActive"=true
       ORDER BY p.model LIMIT 30''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
for r in cur.fetchall():
    print(r[0][:8], "|", r[1][:40], "|", (r[2] or "")[:50])
cur.close()
conn.close()
