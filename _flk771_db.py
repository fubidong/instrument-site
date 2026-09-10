# -*- coding: utf-8 -*-
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT d.title, d."docType", d."filePath" FROM "Document" d JOIN "Product" p ON p.id=d."productId"
       WHERE p."brandId"=%s AND p.model='Fluke 771 毫安级过程钳型表' ''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
rows = cur.fetchall()
print("771 docs:", len(rows))
for r in rows:
    print(" ", r)
cur.close()
conn.close()
