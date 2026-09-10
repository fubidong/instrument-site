# -*- coding: utf-8 -*-
"""从 DB 产品反查 JSON slug，建立 productId -> spec 映射"""
import json, re, psycopg2, os

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.id, p.model, pl.code as line_code
       FROM "Product" p
       LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"
       WHERE p."brandId"=%s AND p."isActive"=true
       ORDER BY p.model''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
db_products = cur.fetchall()
cur.close()
conn.close()

# 加载所有品类英文 JSON
json_files = [
    "flk_clamp_en.json", "flk_ir_en.json", "flk_elec_safety_en.json",
    "flk_condition_en.json", "flk_process_cal_en.json", "flk_power_quality_en.json",
    "flk_scopemeter_en.json", "flk_tc_en.json", "flk_network_en.json",
    "flk_thermal_en.json", "flk_calibration_en.json", "flk_ii905_en.json",
]
all_specs = {}  # slug -> spec
for fn in json_files:
    path = os.path.join("E:/cxy", fn)
    if not os.path.exists(path):
        continue
    d = json.load(open(path, encoding="utf-8"))
    for slug, v in d.items():
        if isinstance(v, dict) and v.get("spec"):
            all_specs[slug] = v["spec"]

print(f"JSON 有 spec 的 slug 总数: {len(all_specs)}")

def normalize_model(model):
    """从 DB model 提取核心型号 token 列表"""
    m = model.upper()
    # 去掉常见中文描述
    m = re.sub(r'[\u4e00-\u9fff].*$', '', m).strip()
    # 去掉 FLUKE 前缀
    m = re.sub(r'^FLUKE[\s\-]*', '', m)
    # 分割成 token
    tokens = re.findall(r'[A-Z0-9]+(?:[\+\-\.][A-Z0-9]+)*', m)
    return tokens

def slug_tokens(slug):
    """从 JSON slug 提取 token"""
    s = slug.upper().replace("FLUKE-", "").replace("-", " ")
    s = s.replace("PLUS", "+").replace("II", "II").replace("MAX", "MAX")
    return re.findall(r'[A-Z0-9\+]+', s)

def match_product(model, all_specs):
    """从 DB model 反查 JSON slug"""
    tokens = normalize_model(model)
    if not tokens:
        return None
    # 主型号 = 第一个含数字的 token
    main = None
    for t in tokens:
        if re.search(r'\d', t):
            main = t
            break
    if not main:
        return None
    # 在 JSON slug 里找包含 main 的
    candidates = []
    for slug in all_specs:
        st = slug_tokens(slug)
        # main 标准化：去掉 + 后缀比较
        main_core = main.rstrip("+")
        slug_main = None
        for t in st:
            if re.search(r'\d', t):
                slug_main = t.rstrip("+")
                break
        if slug_main and main_core == slug_main:
            candidates.append(slug)
    if len(candidates) == 1:
        return candidates[0]
    # 多候选：进一步匹配 ii/plus/max 等修饰
    if len(candidates) > 1:
        model_upper = model.upper()
        best = None
        best_score = 0
        for slug in candidates:
            score = 0
            if "II" in model_upper and "II" in slug.upper():
                score += 2
            if "+" in model_upper and ("PLUS" in slug.upper() or "+" in slug):
                score += 2
            if "MAX" in model_upper and "MAX" in slug.upper():
                score += 2
            if "FC" in model_upper and "FC" in slug.upper():
                score += 2
            if "KIT" in model_upper and "KIT" in slug.upper():
                score += 1
            if score > best_score:
                best_score = score
                best = slug
        if best:
            return best
        return candidates[0]  # 兜底取第一个
    return None

matched = 0
nomatch = 0
mapping = {}  # productId -> spec
nomatch_list = []

for pid, model, line_code in db_products:
    slug = match_product(model, all_specs)
    if slug:
        mapping[pid] = all_specs[slug]
        matched += 1
    else:
        nomatch += 1
        nomatch_list.append((model, line_code))

print(f"DB 产品总数: {len(db_products)}")
print(f"匹配到 spec: {matched}")
print(f"无匹配: {nomatch}")
print(f"\n无匹配产品（前30）:")
for model, lc in nomatch_list[:30]:
    print(f"  [{lc}] {model[:50]}")

# 保存映射
import pickle
with open("E:/cxy/instrument-site/_flk_spec_mapping.pkl", "wb") as f:
    pickle.dump(mapping, f)
print(f"\n映射已保存: {len(mapping)} 个产品")
