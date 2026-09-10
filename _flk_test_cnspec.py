# -*- coding: utf-8 -*-
"""测试 parse_cn_spec 对 Fluke 106 叙述性规格的处理"""
import sys, json, psycopg2
sys.path.insert(0, ".")
from _flk_spec_fix import parse_cn_spec

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT pt."specsOverview" FROM "ProductTranslation" pt JOIN "Product" p ON p.id=pt."productId"
       WHERE p."brandId"=%s AND p.model='Fluke 106' AND pt.locale='zh' ''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
row = cur.fetchone()
cur.close()
conn.close()
spec = row[0] if row else ""
print("spec len:", len(spec))
out = parse_cn_spec(spec)
print("parse_cn_spec ->", repr(out)[:200] if out else "None")
