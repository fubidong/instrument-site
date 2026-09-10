# -*- coding: utf-8 -*-
"""检查几个精确匹配产品的spec解析效果"""
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
for model in ["Fluke 374", "Fluke 87V", "Fluke 1587 FC", "Fluke TiS20+", "Fluke 1663"]:
    cur.execute(
        '''SELECT p.model, t."specsOverview" FROM "Product" p
           LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
           WHERE p."brandId"=%s AND p.model ILIKE %s''',
        ("92c09b46-32f6-4425-bf3b-0bd4825da642", f"%{model}%"),
    )
    r = cur.fetchone()
    if r:
        print(f"\n=== {r[0]} ===")
        spec = r[1] or ""
        print(f"len: {len(spec)}")
        print(spec[:600])
        print("...")
    else:
        print(f"\n=== {model} === NOT FOUND")
cur.close()
conn.close()
