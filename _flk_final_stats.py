# -*- coding: utf-8 -*-
"""最终统计福禄克 specsOverview 状态"""
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT c.code, COUNT(*) as total,
       SUM(CASE WHEN t."specsOverview" IS NOT NULL AND length(t."specsOverview")>50 THEN 1 ELSE 0 END) as has_spec
       FROM "Product" p
       LEFT JOIN "Category" c ON c.id=p."categoryId"
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND p."isActive"=true
       GROUP BY c.code ORDER BY c.code''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
print(f"{'品类':<25} {'总数':>5} {'有规格':>6} {'空':>5}")
print("-" * 45)
total_all = 0
has_all = 0
for r in cur.fetchall():
    total_all += r[1]
    has_all += r[2]
    print(f"{r[0] or '未知':<25} {r[1]:>5} {r[2]:>6} {r[1]-r[2]:>5}")
print("-" * 45)
print(f"{'合计':<25} {total_all:>5} {has_all:>6} {total_all-has_all:>5}")
cur.close()
conn.close()
