# -*- coding: utf-8 -*-
"""查 Fluke 233C 匹配的原始 spec"""
import pickle, json, os

with open("E:/cxy/instrument-site/_flk_spec_mapping.pkl", "rb") as f:
    mapping = pickle.load(f)

import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    'SELECT id, model FROM "Product" WHERE "brandId"=%s AND model ILIKE %s',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642", "%233%"),
)
for pid, model in cur.fetchall():
    print(f"=== {model} (id={pid[:8]})")
    if pid in mapping:
        raw = mapping[pid]
        print("原始 spec 前800字:")
        print(raw[:800])
    else:
        print("(不在映射中，可能是同系列填充)")
    print()
cur.close()
conn.close()
