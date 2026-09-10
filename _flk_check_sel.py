# -*- coding: utf-8 -*-
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    """SELECT p.model, t.selection FROM "Product" p
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND p.model ILIKE %s""",
    ("92c09b46-32f6-4425-bf3b-0bd4825da642", "%15B%MAX%"),
)
for model, sel in cur.fetchall():
    print(f"=== {model} ===")
    print(f"len: {len(sel) if sel else 0}")
    if sel:
        print(sel[:500])
    print()
cur.close()
conn.close()
