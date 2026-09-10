# -*- coding: utf-8 -*-
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    'SELECT model FROM "Product" WHERE "brandId"=%s AND model ILIKE %s ORDER BY model',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642", "%301%"),
)
for r in cur.fetchall():
    print(r[0])
cur.close()
conn.close()
