# -*- coding: utf-8 -*-
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
for model in ["Fluke 289", "Fluke 374", "Fluke TiS20+"]:
    cur.execute(
        '''SELECT p.model, t."specsOverview" FROM "Product" p
           LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
           WHERE p."brandId"=%s AND p.model ILIKE %s''',
        ("92c09b46-32f6-4425-bf3b-0bd4825da642", f"%{model}%"),
    )
    r = cur.fetchone()
    if r:
        spec = r[1] or ""
        print(f"=== {r[0]} ===")
        print(f"len: {len(spec)}")
        print(f"starts with <table: {spec.startswith('<table')}")
        print(f"first 100: {spec[:100]}")
        print()
cur.close()
conn.close()
