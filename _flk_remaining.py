# -*- coding: utf-8 -*-
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.model, c.code as cat, pl.code as line
       FROM "Product" p
       LEFT JOIN "Category" c ON c.id=p."categoryId"
       LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND p."isActive"=true AND (t."specsOverview" IS NULL OR length(t."specsOverview")<20)
       ORDER BY c.code, p.model''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
for r in cur.fetchall():
    print(f"[{r[1]}|{r[2]}] {r[0][:55]}")
cur.close()
conn.close()
