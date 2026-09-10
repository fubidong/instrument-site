# -*- coding: utf-8 -*-
"""对 specsOverview 为空的产品，用同系列已有规格填充"""
import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

# 找所有福禄克产品的系列和 specsOverview
cur.execute(
    '''SELECT p.id, p.model, p."productLineId",
              t_zh."specsOverview" as zh,
              t_en."specsOverview" as en
       FROM "Product" p
       LEFT JOIN "ProductTranslation" t_zh ON t_zh."productId"=p.id AND t_zh.locale='zh'
       LEFT JOIN "ProductTranslation" t_en ON t_en."productId"=p.id AND t_en.locale='en'
       WHERE p."brandId"=%s AND p."isActive"=true''',
    (BRAND,),
)
rows = cur.fetchall()

# 按系列分组，找每个系列有 spec 的产品
from collections import defaultdict
line_specs = defaultdict(list)  # lineId -> [(zh, en)]
for pid, model, lineId, zh, en in rows:
    if zh and len(zh) > 50:
        line_specs[lineId].append((zh, en))

# 对空 spec 的产品，用同系列填充
filled = 0
for pid, model, lineId, zh, en in rows:
    if zh and len(zh) > 50:
        continue  # 已有
    if lineId in line_specs and line_specs[lineId]:
        src_zh, src_en = line_specs[lineId][0]
        cur.execute(
            'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
            (src_zh, pid, "zh"),
        )
        cur.execute(
            'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
            (src_en or src_zh, pid, "en"),
        )
        filled += 1

conn.commit()

# 统计
cur.execute(
    '''SELECT COUNT(*) FROM "Product" p
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND p."isActive"=true AND (t."specsOverview" IS NULL OR length(t."specsOverview")<20)''',
    (BRAND,),
)
remaining_empty = cur.fetchone()[0]

cur.close()
conn.close()
print(f"同系列填充: {filled} 个产品")
print(f"仍为空: {remaining_empty} 个产品")
