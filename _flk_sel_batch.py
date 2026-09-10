# -*- coding: utf-8 -*-
"""批量更新福禄克产品选型"""
import json, re, psycopg2, os, sys
sys.path.insert(0, "E:/cxy/instrument-site")
from _flk_sel_v3 import parse_models_v3, all_models

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    """SELECT p.id, p.model, c.code as cat FROM "Product" p
       LEFT JOIN "Category" c ON c.id=p."categoryId"
       WHERE p."brandId"=%s AND p."isActive"=true""",
    (BRAND,),
)
products = cur.fetchall()

def match_source(model, cat):
    """匹配 models 源"""
    m = model.upper()
    m = re.sub(r'[\u4e00-\u9fff].*$', '', m).strip()
    m = re.sub(r'^FLUKE[\s\-]*', '', m)
    tokens = re.findall(r'[A-Z0-9]+(?:[\+\-\.][A-Z0-9]+)*', m)
    main = None
    for t in tokens:
        if re.search(r'\d', t): main = t.rstrip("+"); break
    if not main: return None

    # 中文 DMM
    if cat == "FLK-DMM":
        for key in all_models:
            if key.startswith("cn_"):
                slug = key[3:]
                s = slug.upper().replace("FLUKE-", "").replace("-", " ").replace("PLUS", "+")
                st = re.findall(r'[A-Z0-9\+]+', s)
                for t in st:
                    if re.search(r'\d', t) and t.rstrip("+") == main:
                        return key
    # 英文
    for key in all_models:
        if key.startswith("en_"):
            slug = key[3:]
            s = slug.upper().replace("FLUKE-", "").replace("-", " ")
            st = re.findall(r'[A-Z0-9\+]+', s)
            for t in st:
                if re.search(r'\d', t) and t.rstrip("+") == main:
                    return key
    return None

updated = 0
for pid, model, cat in products:
    src_key = match_source(model, cat)
    if not src_key:
        continue
    raw = all_models.get(src_key)
    if not raw:
        continue
    html = parse_models_v3(raw)
    if html and len(html) > 50:
        cur.execute(
            'UPDATE "ProductTranslation" SET "selection"=%s WHERE "productId"=%s AND locale=%s',
            (html, pid, "zh"),
        )
        cur.execute(
            'UPDATE "ProductTranslation" SET "selection"=%s WHERE "productId"=%s AND locale=%s',
            (html, pid, "en"),
        )
        updated += 1

conn.commit()
cur.close()
conn.close()
print(f"更新产品选型: {updated} 个产品")
