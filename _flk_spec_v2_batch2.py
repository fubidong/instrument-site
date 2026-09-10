# -*- coding: utf-8 -*-
"""用新映射（含中文DMM）批量更新 specsOverview"""
import sys, pickle
sys.path.insert(0, "E:/cxy/instrument-site")
from _flk_spec_v2 import parse_en_spec_v2
from _flk_spec_v3 import parse_cn_spec_v3
import psycopg2

with open("E:/cxy/instrument-site/_flk_spec_mapping2.pkl", "rb") as f:
    mapping = pickle.load(f)

print(f"映射产品数: {len(mapping)}")

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

updated = 0
for pid, info in mapping.items():
    en_raw = info.get("en")
    cn_raw = info.get("cn")
    cat = info.get("cat")

    # 英文 spec
    en_html = None
    if en_raw:
        en_html = parse_en_spec_v2(en_raw)

    # 中文 spec
    zh_html = None
    if cn_raw and cat == "FLK-DMM":
        zh_html = parse_cn_spec_v3(cn_raw)
    elif en_html:
        zh_html = en_html  # 中文缺用英文填充

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
print(f"更新: {updated} 个产品")
print(f"当前有规格: {has_spec}/395")
