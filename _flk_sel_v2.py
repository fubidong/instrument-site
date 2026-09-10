# -*- coding: utf-8 -*-
"""福禄克产品选型精确修复：按 Fluke 型号分割"""
import json, re, psycopg2, os

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

# 加载所有 models 源
all_models = {}
# 中文 DMM
d = json.load(open("E:/cxy/flk_dmm_tabs.json", encoding="utf-8"))
for slug, v in d.items():
    if isinstance(v, dict) and v.get("models"):
        all_models[f"cn_{slug}"] = v["models"]
# 英文各品类
for fn in os.listdir("E:/cxy"):
    if fn.startswith("flk_") and fn.endswith("_en.json"):
        data = json.load(open(f"E:/cxy/{fn}", encoding="utf-8"))
        for slug, v in data.items():
            if isinstance(v, dict) and v.get("models"):
                all_models[f"en_{slug}"] = v["models"]

print(f"models 源: {len(all_models)}")

def parse_models_v2(text):
    """精确解析：按 Fluke/FLUKE 分割型号"""
    if not text:
        return ""
    s = text.strip()
    # 去掉前缀
    s = re.sub(r'^型号[:：]\s*', '', s)
    # 去掉开头的产品名行（Fluke xxx 经济型数字万用表）
    s = re.sub(r'^Fluke\s+\S+?\s+(经济型|手持式|数字|防烧)[^\n]*?(?=Fluke|FLUKE)', '', s)

    # 按 Fluke 或 FLUKE 分割（前面不是字母）
    parts = re.split(r'(?=(?<![A-Za-z])(?:Fluke|FLUKE)\s)', s)
    parts = [p.strip() for p in parts if p.strip() and re.match(r'^(?:Fluke|FLUKE)\s', p)]

    if not parts:
        return ""

    rows = []
    for part in parts:
        # 型号名：到 "数字万用表"、"防烧万用表"、"工具套装"、"万用表" 之前
        m = re.match(r'^((?:Fluke|FLUKE)\s+[^，。；\n]+?)(?:\s+(数字万用表|防烧万用表|工具套装|万用表|手持式|经济型))?\s*(.*)$', part, re.DOTALL)
        if m:
            model = m.group(1).strip()
            suffix = m.group(2) or ""
            config = m.group(3).strip()
            # 配件前加分号
            config = re.sub(r'(TL\d+|TP\d+|\d+\s*节\s*AA|用户手册|磁性挂件|绝缘十字螺丝刀|保护帽|软件|数据线|便携箱|硬壳|温度探头|电流钳|测试导线|表笔)', r'；\1', config)
            config = re.sub(r'；+', '；', config).strip('；')
            if suffix:
                config = suffix + "；" + config if config else suffix
            rows.append((model, config))
        else:
            rows.append((part[:50], part[50:]))

    if not rows:
        return ""

    html = ['<table class="selection-table" style="width:100%;border-collapse:collapse;font-size:13px;">']
    html.append('<thead><tr style="background:#f1f5f9;"><th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left;width:30%;">型号</th><th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left;">配置/包含</th></tr></thead><tbody>')
    for idx, (model, config) in enumerate(rows):
        bg = 'background:#f8fafc;' if idx % 2 == 0 else ''
        html.append(f'<tr style="{bg}"><td style="border:1px solid #e2e8f0;padding:6px 8px;font-weight:500;">{model}</td><td style="border:1px solid #e2e8f0;padding:6px 8px;white-space:pre-line;">{config}</td></tr>')
    html.append('</tbody></table>')
    return '\n'.join(html)


# 测试
test = all_models.get("cn_fluke-15b-max", "")
print("=== 测试 15B MAX ===")
print(parse_models_v2(test)[:1200])
