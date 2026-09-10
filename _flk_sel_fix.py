# -*- coding: utf-8 -*-
"""福禄克产品选型保守修复：只按型号名分段，配置保留原样"""
import json, re, psycopg2, os

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

# 加载中文 DMM models
cn_dmm = {}
d = json.load(open("E:/cxy/flk_dmm_tabs.json", encoding="utf-8"))
for slug, v in d.items():
    if isinstance(v, dict) and v.get("models"):
        cn_dmm[slug] = v["models"]

# 加载英文各品类 models
en_models = {}
for fn in os.listdir("E:/cxy"):
    if fn.startswith("flk_") and fn.endswith("_en.json"):
        data = json.load(open(f"E:/cxy/{fn}", encoding="utf-8"))
        for slug, v in data.items():
            if isinstance(v, dict) and v.get("models"):
                en_models[slug] = v["models"]

print(f"中文DMM models: {len(cn_dmm)}, 英文models: {len(en_models)}")

def parse_models_simple(text):
    """简单分段：按 Fluke 型号名分段，配置保留原样"""
    if not text:
        return ""
    s = text.strip()
    # 去掉前缀
    s = re.sub(r'^型号[:：]\s*', '', s)
    s = re.sub(r'^Fluke\s+\S+?\s+(数字万用表|万用表|经济型|手持式)[^\n]*', '', s)

    # 在每个 Fluke 型号前插入分隔符
    # 型号模式：Fluke xxx-xx/CN 或 Fluke xxx KIT/CN 或 FLUKE xxx
    pattern = r'(?=(?:Fluke|FLUKE)\s+\S+?(?:/CN|KIT|TP\s+KIT|数字万用表|防烧|经济型))'
    s = re.sub(pattern, '\n|||', s)

    parts = [p.strip() for p in s.split('\n|||') if p.strip()]
    if not parts:
        return ""

    html = ['<table class="selection-table" style="width:100%;border-collapse:collapse;font-size:13px;">']
    html.append('<thead><tr style="background:#f1f5f9;"><th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left;width:30%;">型号</th><th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left;">配置/包含</th></tr></thead><tbody>')

    for idx, part in enumerate(parts):
        # 型号 = 开头到第一个空格+中文
        m = re.match(r'^((?:Fluke|FLUKE)\s+\S+?)\s*(.*)$', part, re.DOTALL)
        if m:
            model = m.group(1).strip()
            config = m.group(2).strip()
            # 配置里在配件前加分号
            config = re.sub(r'(TL\d+|TP\d+|\d+\s*节\s*AA|用户手册|磁性挂件|绝缘十字螺丝刀|保护帽|软件|数据线|便携箱|硬壳|温度探头|电流钳)', r'；\1', config)
            config = re.sub(r'；+', '；', config).strip('；')
            bg = 'background:#f8fafc;' if idx % 2 == 0 else ''
            html.append(f'<tr style="{bg}"><td style="border:1px solid #e2e8f0;padding:6px 8px;font-weight:500;">{model}</td><td style="border:1px solid #e2e8f0;padding:6px 8px;white-space:pre-line;">{config}</td></tr>')
        else:
            html.append(f'<tr><td colspan="2" style="border:1px solid #e2e8f0;padding:6px 8px;">{part}</td></tr>')

    html.append('</tbody></table>')
    return '\n'.join(html)


conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    """SELECT p.id, p.model, c.code as cat FROM "Product" p
       LEFT JOIN "Category" c ON c.id=p."categoryId"
       WHERE p."brandId"=%s AND p."isActive"=true""",
    (BRAND,),
)
products = cur.fetchall()

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

updated = 0
for pid, model, cat in products:
    raw = None
    if cat == "FLK-DMM":
        slug = match_cn_dmm(model)
        if slug:
            raw = cn_dmm.get(slug)
    if not raw:
        # 英文匹配
        core = model.lower().replace("fluke ", "").replace("fluke-", "").replace(" ", "-")
        for slug in en_models:
            if slug.lower().replace("fluke-", "") == core:
                raw = en_models[slug]
                break

    if raw:
        html = parse_models_simple(raw)
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
