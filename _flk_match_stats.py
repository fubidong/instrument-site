# -*- coding: utf-8 -*-
"""福禄克 JSON slug → DB product 匹配统计"""
import json, re, psycopg2, glob, os

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT id, model FROM "Product" WHERE "brandId"=%s AND "isActive"=true''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
db_products = cur.fetchall()
cur.close()
conn.close()

def extract_core(slug):
    """从 slug 提取核心型号，如 fluke-301d -> 301D, fluke-15b-max -> 15B MAX"""
    s = slug.lower().replace("fluke-", "").replace("-", " ").strip()
    return s

def match_db(core, db_products):
    """在 DB model 里模糊匹配核心型号"""
    core_upper = core.upper()
    # 精确匹配：model 包含 core（不区分大小写）
    matches = []
    for pid, model in db_products:
        if core_upper in model.upper():
            matches.append((pid, model))
    return matches

# 遍历所有品类英文 JSON
json_files = [
    "flk_clamp_en.json", "flk_ir_en.json", "flk_elec_safety_en.json",
    "flk_condition_en.json", "flk_process_cal_en.json", "flk_power_quality_en.json",
    "flk_scopemeter_en.json", "flk_tc_en.json", "flk_network_en.json",
    "flk_thermal_en.json", "flk_calibration_en.json", "flk_ii905_en.json",
]

total_spec = 0
matched = 0
multi = 0
nomatch = 0
nomatch_list = []

for fn in json_files:
    path = os.path.join("E:/cxy", fn)
    if not os.path.exists(path):
        continue
    d = json.load(open(path, encoding="utf-8"))
    for slug, v in d.items():
        if not isinstance(v, dict) or not v.get("spec"):
            continue
        total_spec += 1
        core = extract_core(slug)
        m = match_db(core, db_products)
        if len(m) == 1:
            matched += 1
        elif len(m) > 1:
            multi += 1
            print(f"MULTI: {slug} (core={core}) -> {[x[1][:30] for x in m[:3]]}")
        else:
            nomatch += 1
            nomatch_list.append((slug, core))

print(f"\n=== 统计 ===")
print(f"有 spec 的 JSON 条目: {total_spec}")
print(f"唯一匹配: {matched}")
print(f"多匹配: {multi}")
print(f"无匹配: {nomatch}")
print(f"\n无匹配列表（前20）:")
for slug, core in nomatch_list[:20]:
    print(f"  {slug} (core={core})")
