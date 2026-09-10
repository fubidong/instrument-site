# -*- coding: utf-8 -*-
"""对含表头特征的中文叙述性 spec（HTML 但未切分）用新逻辑强制重跑"""
import re, sys, psycopg2
sys.path.insert(0, "E:/cxy/instrument-site")
from _flk_spec_fix import parse_cn_spec

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT pt.id, pt."specsOverview", p.model FROM "ProductTranslation" pt
       JOIN "Product" p ON p.id=pt."productId" WHERE p."brandId"=%s''',
    (BRAND,),
)
rows = cur.fetchall()
updated = 0
for ptid, spec, model in rows:
    if not spec or "<table" not in spec:
        continue
    # strip HTML 文本
    raw = re.sub(r"<[^>]+>", " ", spec)
    # 只处理含表头特征的中文叙述性规格
    if not any(k in raw for k in ("功能量程分辨率精度", "量程/分辨率", "精度规格", "技术规格", "技术指标")):
        continue
    if "交流电压" not in raw and "直流电压" not in raw and "电阻" not in raw:
        continue
    new = parse_cn_spec(raw)
    if new and len(new) > 100:
        cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE id=%s', (new, ptid))
        updated += 1
conn.commit()
print("updated:", updated)
cur.close()
conn.close()
