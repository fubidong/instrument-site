# -*- coding: utf-8 -*-
"""用 v2 解析器重新批量更新福禄克精确匹配产品的 specsOverview"""
import sys, os, json, pickle, re
sys.path.insert(0, "E:/cxy/instrument-site")
from _flk_spec_v2 import parse_en_spec_v2
from _flk_spec_v3 import parse_cn_spec_v3
import psycopg2

with open("E:/cxy/instrument-site/_flk_spec_mapping.pkl", "rb") as f:
    mapping = pickle.load(f)

print(f"精确匹配产品数: {len(mapping)}")

# 中文 DMM spec
cn_dmm = {}
try:
    d = json.load(open("E:/cxy/flk_dmm_tabs.json", encoding="utf-8"))
    for k, v in d.items():
        if isinstance(v, dict) and v.get("spec"):
            cn_dmm[k] = v["spec"]
except: pass

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

cur.execute(
    '''SELECT p.id, p.model, c.code as cat_code
       FROM "Product" p
       LEFT JOIN "Category" c ON c.id=p."categoryId"
       WHERE p."brandId"=%s''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
prod_info = {r[0]: {"model": r[1], "cat": r[2]} for r in cur.fetchall()}

def match_cn_dmm(model):
    m = model.upper()
    m = re.sub(r'[\u4e00-\u9fff].*$', '', m).strip()
    m = re.sub(r'^FLUKE[\s\-]*', '', m)
    tokens = re.findall(r'[A-Z0-9]+(?:[\+\-\.][A-Z0-9]+)*', m)
    main = None
    for t in tokens:
        if re.search(r'\d', t):
            main = t.rstrip("+")
            break
    if not main: return None
    for slug, spec in cn_dmm.items():
        s = slug.upper().replace("FLUKE-", "").replace("-", " ").replace("PLUS", "+")
        st = re.findall(r'[A-Z0-9\+]+', s)
        for t in st:
            if re.search(r'\d', t) and t.rstrip("+") == main:
                return spec
    return None

updated = 0
for pid, en_spec_raw in mapping.items():
    info = prod_info.get(pid)
    if not info: continue

    en_html = parse_en_spec_v2(en_spec_raw)
    if not en_html or len(en_html) < 20: continue

    zh_html = None
    if info["cat"] == "FLK-DMM":
        cn_raw = match_cn_dmm(info["model"])
        if cn_raw:
            zh_html = parse_cn_spec_v3(cn_raw)
    if not zh_html:
        zh_html = en_html

    cur.execute(
        'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
        (en_html, pid, "en"),
    )
    cur.execute(
        'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
        (zh_html, pid, "zh"),
    )
    updated += 1

conn.commit()
cur.close()
conn.close()
print(f"更新完成: {updated} 个产品")
