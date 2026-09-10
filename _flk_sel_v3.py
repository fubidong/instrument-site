# -*- coding: utf-8 -*-
"""福禄克产品选型精确修复 v3"""
import json, re, psycopg2, os

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

all_models = {}
d = json.load(open("E:/cxy/flk_dmm_tabs.json", encoding="utf-8"))
for slug, v in d.items():
    if isinstance(v, dict) and v.get("models"):
        all_models[f"cn_{slug}"] = v["models"]
for fn in os.listdir("E:/cxy"):
    if fn.startswith("flk_") and fn.endswith("_en.json"):
        data = json.load(open(f"E:/cxy/{fn}", encoding="utf-8"))
        for slug, v in data.items():
            if isinstance(v, dict) and v.get("models"):
                all_models[f"en_{slug}"] = v["models"]

def parse_models_v3(text):
    if not text:
        return ""
    s = text.strip()
    s = re.sub(r'^型号[:：]\s*', '', s)
    # 去掉开头的产品名（Fluke xxx 经济型数字万用表），直到第一个真正的型号
    # 真正的型号通常包含 -01/CN、-02/CN、KIT/CN 等后缀

    # 在所有 Fluke/FLUKE 前插入分割符
    s = re.sub(r'(?=(?:Fluke|FLUKE)\s)', '\n|||', s)
    parts = [p.strip() for p in s.split('\n|||') if p.strip()]

    rows = []
    for part in parts:
        # 跳过纯产品名行（不含配件关键词）
        if not any(kw in part for kw in ['表笔', '电池', '手册', '测试线', '探头', '软件', 'TL', 'TP', 'AA', '挂件', '螺丝刀', '箱', '线']):
            # 可能是纯型号名，保留
            if re.search(r'[-/]\w+', part) or 'KIT' in part.upper():
                rows.append((part, ''))
            continue

        # 找型号结束位置：第一个配件关键词前
        # 配件关键词
        acc_match = re.search(r'(TL\d+|TP\d+|\d+\s*节\s*AA|用户手册|测试表笔|特尖表笔|表笔|磁性挂件|绝缘十字螺丝刀|保护帽|软件|数据线|便携箱|硬壳|温度探头|电流钳|测试导线)', part)
        if acc_match:
            model_part = part[:acc_match.start()].strip()
            config_part = part[acc_match.start():].strip()
        else:
            model_part = part[:80]
            config_part = part[80:]

        # 型号名：去掉末尾的"数字万用表"、"防烧万用表"等
        model_name = re.sub(r'\s*(数字万用表|防烧万用表|工具套装|万用表|手持式|经济型|数字)\s*$', '', model_part).strip()
        # 如果型号名里包含两个 Fluke（如 "Fluke 15B MAX-01/CNFluke 15B MAX-01"），取第一个
        model_name = re.sub(r'(Fluke|FLUKE)\s.*$', lambda m: m.group(0).split('Fluke')[0].strip() if 'Fluke' in m.group(0)[1:] else m.group(0), model_name)
        # 更简单：取第一个 Fluke 到下一个 Fluke 之前
        fluke_parts = re.split(r'(?=(?:Fluke|FLUKE)\s)', model_name)
        if len(fluke_parts) > 1:
            model_name = fluke_parts[0].strip() or fluke_parts[1].strip()

        # 配置：配件前加分号
        config = re.sub(r'(TL\d+|TP\d+|\d+\s*节\s*AA|用户手册|测试表笔|特尖表笔|磁性挂件|绝缘十字螺丝刀|保护帽|软件|数据线|便携箱|硬壳|温度探头|电流钳|测试导线)', r'；\1', config_part)
        config = re.sub(r'；+', '；', config).strip('；')

        if model_name:
            rows.append((model_name, config))

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
print("=== 15B MAX ===")
print(parse_models_v3(test)[:1500])
