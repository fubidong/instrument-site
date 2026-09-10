# -*- coding: utf-8 -*-
"""从原始 JSON 源数据用三列解析器批量更新福禄克 DMM 规格"""
import json, re, sys, psycopg2
sys.path.insert(0, "E:/cxy/instrument-site")
from _flk_spec_v3 import parse_cn_spec_v3

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

# 各品类 JSON 文件（含原始 spec）
json_files = {
    "flk_dmm_tabs.json": "DMM",
    "flk_clamp_en.json": "CLAMP",
    "flk_ir_en.json": "IR",
    "flk_elec_safety_en.json": "ELEC",
    "flk_condition_en.json": "CONDITION",
    "flk_process_cal_en.json": "PCAL",
    "flk_tc_en.json": "TC",
}

def slug_to_model(slug):
    m = re.sub(r"^fluke-", "", slug)
    m = re.sub(r"[-_]", " ", m)
    parts = m.split()
    out = []
    for p in parts:
        if p.isdigit():
            out.append(p)
        elif len(p) <= 2 and p.upper() == p:
            out.append(p)
        else:
            out.append(p.upper())
    return "Fluke " + " ".join(out) if out else ""

updated = 0
matched = 0
for fn, tag in json_files.items():
    try:
        data = json.load(open(f"E:/cxy/{fn}", encoding="utf-8"))
    except Exception as e:
        print("skip", fn, e)
        continue
    if not isinstance(data, dict):
        continue
    for slug, rec in data.items():
        if not isinstance(rec, dict):
            continue
        spec = rec.get("spec") or ""
        if "量程/分辨率" not in spec and "基本精度" not in spec:
            continue
        new = parse_cn_spec_v3(spec)
        if not new:
            continue
        # 匹配 DB 产品：优先按 slug 精确转 model
        model = slug_to_model(slug)
        cur.execute(
            '''SELECT pt.id FROM "ProductTranslation" pt JOIN "Product" p ON p.id=pt."productId"
               WHERE p."brandId"=%s AND (p.model=%s OR p.model ILIKE %s) AND pt.locale='zh' LIMIT 1''',
            (BRAND, model, f"%{model}%"),
        )
        r = cur.fetchone()
        if not r:
            continue
        cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE id=%s', (new, r[0]))
        updated += 1
        matched += 1

conn.commit()
print("matched+updated:", updated)
cur.close()
conn.close()
