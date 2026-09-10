# -*- coding: utf-8 -*-
"""重新建立福禄克 spec 映射：英文 JSON + 中文 DMM JSON"""
import json, re, os, pickle

# 加载所有品类英文 JSON
json_files = [
    "flk_clamp_en.json", "flk_ir_en.json", "flk_elec_safety_en.json",
    "flk_condition_en.json", "flk_process_cal_en.json", "flk_power_quality_en.json",
    "flk_scopemeter_en.json", "flk_tc_en.json", "flk_network_en.json",
    "flk_thermal_en.json", "flk_calibration_en.json", "flk_ii905_en.json",
]
en_specs = {}  # slug -> spec
for fn in json_files:
    path = os.path.join("E:/cxy", fn)
    if not os.path.exists(path): continue
    d = json.load(open(path, encoding="utf-8"))
    for slug, v in d.items():
        if isinstance(v, dict) and v.get("spec"):
            en_specs[slug] = v["spec"]

# 中文 DMM JSON
cn_dmm = {}
d = json.load(open("E:/cxy/flk_dmm_tabs.json", encoding="utf-8"))
for slug, v in d.items():
    if isinstance(v, dict) and v.get("spec"):
        cn_dmm[slug] = v["spec"]

print(f"英文 spec: {len(en_specs)}, 中文 DMM spec: {len(cn_dmm)}")

import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.id, p.model, c.code as cat
       FROM "Product" p
       LEFT JOIN "Category" c ON c.id=p."categoryId"
       WHERE p."brandId"=%s AND p."isActive"=true''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
db_products = cur.fetchall()
cur.close()
conn.close()

def extract_core(slug):
    s = slug.lower().replace("fluke-", "").replace("-", " ").strip()
    return s

def match_en(core):
    core_upper = core.upper()
    matches = []
    for slug in en_specs:
        st = extract_core(slug).upper()
        st_main = None
        for t in st.split():
            if re.search(r'\d', t):
                st_main = t.rstrip("+"); break
        core_main = None
        for t in core_upper.split():
            if re.search(r'\d', t):
                core_main = t.rstrip("+"); break
        if st_main and core_main and st_main == core_main:
            matches.append(slug)
    if len(matches) == 1: return matches[0]
    if len(matches) > 1:
        # 修饰词匹配
        best = None; best_score = 0
        for slug in matches:
            score = 0
            su = slug.upper()
            cu = core_upper
            if "II" in cu and "II" in su: score += 2
            if "+" in cu and ("PLUS" in su or "+" in su): score += 2
            if "MAX" in cu and "MAX" in su: score += 2
            if "FC" in cu and "FC" in su: score += 2
            if "KIT" in cu and "KIT" in su: score += 1
            if score > best_score: best_score = score; best = slug
        return best or matches[0]
    return None

def match_cn_dmm(model):
    m = model.upper()
    m = re.sub(r'[\u4e00-\u9fff].*$', '', m).strip()
    m = re.sub(r'^FLUKE[\s\-]*', '', m)
    tokens = re.findall(r'[A-Z0-9]+(?:[\+\-\.][A-Z0-9]+)*', m)
    main = None
    for t in tokens:
        if re.search(r'\d', t): main = t.rstrip("+"); break
    if not main: return None
    for slug in cn_dmm:
        s = slug.upper().replace("FLUKE-", "").replace("-", " ").replace("PLUS", "+")
        st = re.findall(r'[A-Z0-9\+]+', s)
        for t in st:
            if re.search(r'\d', t) and t.rstrip("+") == main:
                return slug
    return None

mapping = {}  # productId -> {en: spec, cn: spec or None}
matched_en = 0
matched_cn = 0

for pid, model, cat in db_products:
    core = extract_core(model.replace("Fluke ", "").replace("FLUKE ", ""))
    en_slug = match_en(core)
    cn_slug = match_cn_dmm(model) if cat == "FLK-DMM" else None

    en_spec = en_specs.get(en_slug) if en_slug else None
    cn_spec = cn_dmm.get(cn_slug) if cn_slug else None

    if en_spec or cn_spec:
        mapping[pid] = {"en": en_spec, "cn": cn_spec, "model": model, "cat": cat}
        if en_spec: matched_en += 1
        if cn_spec: matched_cn += 1

print(f"\n匹配结果: {len(mapping)}/{len(db_products)}")
print(f"  英文源: {matched_en}")
print(f"  中文DMM源: {matched_cn}")

# 保存
with open("E:/cxy/instrument-site/_flk_spec_mapping2.pkl", "wb") as f:
    pickle.dump(mapping, f)
print("映射已保存")
