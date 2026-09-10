# -*- coding: utf-8 -*-
"""撤销同系列填充，只保留精确匹配的215个产品的spec
   未精确匹配的产品清空specsOverview（避免错误参数）
"""
import pickle, psycopg2

with open("E:/cxy/instrument-site/_flk_spec_mapping.pkl", "rb") as f:
    mapping = pickle.load(f)  # 精确匹配的215个

matched_ids = set(mapping.keys())
print(f"精确匹配产品数: {len(matched_ids)}")

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

# 查所有福禄克产品
cur.execute(
    'SELECT id, model FROM "Product" WHERE "brandId"=%s AND "isActive"=true',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
all_products = cur.fetchall()

# 对未精确匹配的产品，清空 specsOverview
cleared = 0
for pid, model in all_products:
    if pid not in matched_ids:
        cur.execute(
            'UPDATE "ProductTranslation" SET "specsOverview"=NULL WHERE "productId"=%s',
            (pid,),
        )
        if cur.rowcount > 0:
            cleared += 1

conn.commit()

# 统计
cur.execute(
    '''SELECT COUNT(*) FROM "Product" p
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND p."isActive"=true AND t."specsOverview" IS NOT NULL AND length(t."specsOverview")>50''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
has_spec = cur.fetchone()[0]
cur.close()
conn.close()

print(f"清空错误填充: {cleared} 个产品")
print(f"剩余有规格(精确匹配): {has_spec} 个产品")
