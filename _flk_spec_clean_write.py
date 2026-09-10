# -*- coding: utf-8 -*-
"""清空所有福禄克 specsOverview，然后只写入匹配的238个"""
import sys, pickle
sys.path.insert(0, "E:/cxy/instrument-site")
from _flk_spec_v2 import parse_en_spec_v2
from _flk_spec_v3 import parse_cn_spec_v3
import psycopg2

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

with open("E:/cxy/instrument-site/_flk_spec_mapping2.pkl", "rb") as f:
    mapping = pickle.load(f)

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

# 1. 清空所有福禄克产品的 specsOverview
cur.execute(
    '''UPDATE "ProductTranslation" SET "specsOverview"=NULL
       WHERE "productId" IN (SELECT id FROM "Product" WHERE "brandId"=%s)''',
    (BRAND,),
)
cleared = cur.rowcount
print(f"清空: {cleared} 条翻译")

# 2. 只写入匹配的
updated = 0
for pid, info in mapping.items():
    en_raw = info.get("en")
    cn_raw = info.get("cn")
    cat = info.get("cat")

    en_html = parse_en_spec_v2(en_raw) if en_raw else None
    zh_html = None
    if cn_raw and cat == "FLK-DMM":
        zh_html = parse_cn_spec_v3(cn_raw)
    elif en_html:
        zh_html = en_html

    if en_html and len(en_html) > 20:
        cur.execute(
            'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
            (en_html, pid, "en"),
        )
    if zh_html and len(zh_html) > 20:
        cur.execute(
            'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
            (zh_html, pid, "zh"),
        )
    updated += 1

conn.commit()

cur.execute(
    '''SELECT COUNT(*) FROM "Product" p
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND p."isActive"=true AND t."specsOverview" IS NOT NULL AND length(t."specsOverview")>50''',
    (BRAND,),
)
has_spec = cur.fetchone()[0]
cur.close()
conn.close()
print(f"写入: {updated} 个产品")
print(f"最终有规格: {has_spec}/395")
