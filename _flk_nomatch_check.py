# -*- coding: utf-8 -*-
"""检查无匹配产品的现有 specsOverview 状态"""
import pickle, psycopg2

with open("E:/cxy/instrument-site/_flk_spec_mapping.pkl", "rb") as f:
    mapping = pickle.load(f)

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.id, p.model, c.code as cat,
              t_zh."specsOverview" as zh_spec,
              t_en."specsOverview" as en_spec
       FROM "Product" p
       LEFT JOIN "Category" c ON c.id=p."categoryId"
       LEFT JOIN "ProductTranslation" t_zh ON t_zh."productId"=p.id AND t_zh.locale='zh'
       LEFT JOIN "ProductTranslation" t_en ON t_en."productId"=p.id AND t_en.locale='en'
       WHERE p."brandId"=%s AND p."isActive"=true
       ORDER BY p.model''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
rows = cur.fetchall()
cur.close()
conn.close()

matched_ids = set(mapping.keys())
nomatch = [r for r in rows if r[0] not in matched_ids]
print(f"无匹配产品: {len(nomatch)}")

empty_zh = sum(1 for r in nomatch if not r[3] or len(r[3]) < 20)
empty_en = sum(1 for r in nomatch if not r[4] or len(r[4]) < 20)
print(f"  中文 specsOverview 为空/过短: {empty_zh}")
print(f"  英文 specsOverview 为空/过短: {empty_en}")

# 按品类统计
from collections import Counter
cats = Counter(r[2] for r in nomatch)
print(f"\n无匹配产品按品类:")
for cat, cnt in cats.most_common():
    print(f"  {cat}: {cnt}")

# 列出空 specsOverview 的产品
print(f"\n中文 specsOverview 为空的产品（前20）:")
for r in nomatch:
    if not r[3] or len(r[3]) < 20:
        print(f"  [{r[2]}] {r[1][:50]}")
