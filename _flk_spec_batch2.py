# -*- coding: utf-8 -*-
"""批量把福禄克官网 spec 写入 ProductTranslation.specsOverview（中英文）"""
import sys, os, json, pickle, re
sys.path.insert(0, "E:/cxy/instrument-site")
from _flk_spec_fix import parse_en_spec
from _flk_spec_v3 import parse_cn_spec_v3
import psycopg2

# 加载映射
with open("E:/cxy/instrument-site/_flk_spec_mapping.pkl", "rb") as f:
    mapping = pickle.load(f)  # productId -> en_spec_raw

print(f"映射产品数: {len(mapping)}")

# 加载中文 DMM spec
cn_dmm = {}
try:
    d = json.load(open("E:/cxy/flk_dmm_tabs.json", encoding="utf-8"))
    for k, v in d.items():
        if isinstance(v, dict) and v.get("spec"):
            cn_dmm[k] = v["spec"]
    print(f"中文 DMM spec: {len(cn_dmm)}")
except Exception as e:
    print(f"中文 DMM 加载失败: {e}")

# DB 连接
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

# 获取所有福禄克产品的 category 和 model
cur.execute(
    '''SELECT p.id, p.model, c.code as cat_code
       FROM "Product" p
       LEFT JOIN "Category" c ON c.id=p."categoryId"
       WHERE p."brandId"=%s''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
prod_info = {r[0]: {"model": r[1], "cat": r[2]} for r in cur.fetchall()}

def match_cn_dmm(model):
    """从 DB model 反查中文 DMM spec"""
    m = model.upper()
    # 提取核心型号
    m = re.sub(r'[\u4e00-\u9fff].*$', '', m).strip()
    m = re.sub(r'^FLUKE[\s\-]*', '', m)
    tokens = re.findall(r'[A-Z0-9]+(?:[\+\-\.][A-Z0-9]+)*', m)
    main = None
    for t in tokens:
        if re.search(r'\d', t):
            main = t.rstrip("+")
            break
    if not main:
        return None
    for slug, spec in cn_dmm.items():
        s = slug.upper().replace("FLUKE-", "").replace("-", " ").replace("PLUS", "+")
        st = re.findall(r'[A-Z0-9\+]+', s)
        for t in st:
            if re.search(r'\d', t) and t.rstrip("+") == main:
                return spec
    return None

updated_en = 0
updated_zh = 0
skipped = 0

for pid, en_spec_raw in mapping.items():
    info = prod_info.get(pid)
    if not info:
        skipped += 1
        continue

    # 英文 spec
    en_html = parse_en_spec(en_spec_raw)
    if not en_html or len(en_html) < 20:
        skipped += 1
        continue

    # 中文 spec
    zh_html = None
    if info["cat"] == "FLK-DMM":
        cn_spec_raw = match_cn_dmm(info["model"])
        if cn_spec_raw:
            zh_html = parse_cn_spec_v3(cn_spec_raw)
    if not zh_html:
        zh_html = en_html  # 中文缺则用英文填充

    # 更新英文
    cur.execute(
        '''UPDATE "ProductTranslation" SET "specsOverview"=%s
           WHERE "productId"=%s AND locale='en' ''',
        (en_html, pid),
    )
    if cur.rowcount > 0:
        updated_en += 1

    # 更新中文
    cur.execute(
        '''UPDATE "ProductTranslation" SET "specsOverview"=%s
           WHERE "productId"=%s AND locale='zh' ''',
        (zh_html, pid),
    )
    if cur.rowcount > 0:
        updated_zh += 1

conn.commit()
cur.close()
conn.close()

print(f"\n=== 结果 ===")
print(f"英文 specsOverview 更新: {updated_en}")
print(f"中文 specsOverview 更新: {updated_zh}")
print(f"跳过: {skipped}")
