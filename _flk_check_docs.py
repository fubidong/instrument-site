# -*- coding: utf-8 -*-
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    """SELECT p.id, p.model FROM "Product" p WHERE p."brandId"=%s AND p.model ILIKE %s""",
    ("92c09b46-32f6-4425-bf3b-0bd4825da642", "%15B%MAX%"),
)
for pid, model in cur.fetchall():
    print(f"Product: {model} (id={pid})")
    cur.execute(
        """SELECT d."docType", d.title, d."filePath" FROM "Document" d WHERE d."productId"=%s""",
        (pid,),
    )
    for dt, title, fp in cur.fetchall():
        print(f"  {dt}: {title} -> {fp}")
cur.close()
conn.close()
