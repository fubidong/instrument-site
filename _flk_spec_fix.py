# -*- coding: utf-8 -*-
"""把福禄克紧凑 specsOverview/selection 转成 HTML 表格（存回 DB 一次性修复）
用法: python _flk_spec_fix.py <en_json> <out_json> [--only-slug]
"""
import json, re, sys, html

def esc(s):
    return html.escape(s, quote=False)

def parse_en_spec(text):
    """英文紧凑 spec -> 结构化 HTML（参数名加粗 + Range/Res/Acc 值行）"""
    if not text:
        return None
    t = re.sub(r'^Specifications:\s*', '', text).strip()
    if len(t) < 8:
        return None
    kws = ["AC Current", "DC Current", "AC Voltage", "DC Voltage", "Resistance", "Frequency",
           "Capacitance", "Diode", "T-rms", "Continuity", "Hold", "Backlight", "Safety rating",
           "Weight", "Size", "Jaw Opening", "Clamp", "Display", "Battery", "Operating", "Storage",
           "Temperature", "Warranty", "Auto", "Data Hold", "Peak", "Inrush", "Response", "Duty",
           "Counts", "Accuracy", "Resolution", "Range", "General", "Maximum", "Differential",
           "Battery Type", "Battery Life", "Power Off", "Relative Humidity", "Humidity", "Altitude",
           "Coefficient", "Dimensions", "Ingress", "Protection", "Safety", "Electromagnetic", "Environment",
           "True", "RMS", "AC/DC"]
    for kw in kws:
        t = re.sub(r'\s+(' + re.escape(kw) + r')(?![A-Za-z])', r'\n\1', t, flags=re.I)
    lines = [l.strip() for l in t.split("\n") if l.strip()]
    blocks = []
    i = 0
    while i < len(lines):
        l = lines[i]
        m = re.match(r'^(Range|Resolution|Accuracy)\s+(.+)$', l, re.I)
        if m:
            # 三元组：找上一参数名（最近的非 sk 行）
            name = ""
            for b in reversed(blocks):
                if isinstance(b, dict) and b.get("name"):
                    name = b["name"]
                    break
            sk = m.group(1).title()
            val = m.group(2).strip()
            # 合并后续 sk 行到同一参数
            while i + 1 < len(lines) and re.match(r'^(Range|Resolution|Accuracy)\s+', lines[i + 1], re.I):
                i += 1
                m2 = re.match(r'^(Range|Resolution|Accuracy)\s+(.+)$', lines[i], re.I)
                blocks.append({"sk": m2.group(1).title(), "val": m2.group(2).strip(), "name": name})
            blocks.append({"sk": sk, "val": val, "name": name})
            i += 1
            continue
        # 参数名行 或 参数名+值 行
        mv = re.match(r'^([A-Z][A-Za-z ()/&%.\-]{2,60}?)\s+([\d●].*)$', l)
        if mv and not re.match(r'^(Range|Resolution|Accuracy)\s', l, re.I):
            blocks.append({"name": mv.group(1).strip(), "val": mv.group(2).strip()})
            i += 1
            continue
        blocks.append({"name": l})
        i += 1
    # 生成 HTML
    out = []
    pending = ""
    for b in blocks:
        if "sk" in b:
            out.append(f"<tr><td class='sk'>{esc(b['sk'])}</td><td>{esc(b['val'])}</td></tr>")
        elif "val" in b:
            out.append(f"<tr><td class='pn'>{esc(b['name'])}</td><td>{esc(b['val'])}</td></tr>")
        else:
            out.append(f"<tr class='sg'><td colspan='2'><b>{esc(b['name'])}</b></td></tr>")
    if not out:
        return None
    return "<table class='spec-table'><tbody>" + "".join(out) + "</tbody></table>"

def parse_cn_spec(text):
    """中文紧凑 spec -> 结构化 HTML（表头 + 功能名行）"""
    if not text:
        return None
    t = re.sub(r'^产品规格[:：]?\s*', '', text).strip()
    if len(t) < 8:
        return None
    # 表头前加换行
    headers = ["精度规格", "技术规格", "技术指标", "功能过载保护", "通用技术指标", "通用技术参数",
               "环境指标", "安全规格", "机械和通用规格", "功能量程分辨率精度", "精度规格功能量程分辨率精度",
               "精度规格形式", "校准后", "电气技术指标"]
    for h in headers:
        t = re.sub(r'(' + re.escape(h) + r')', r'\n<<H>>\1', t)
    # 功能名（长先短后）前加换行
    funcs = ["交流电压（毫伏）", "直流电压（毫伏）", "交流电压", "直流电压", "交流毫伏", "直流毫伏",
             "电阻（欧姆）", "电阻", "电容", "频率", "占空比", "交流电流", "直流电流", "通断性",
             "二极管测试", "二极管", "背光灯", "最高电压", "过电压保护", "显示屏", "工作温度",
             "存放温度", "存储温度", "电池类型", "电池寿命", "尺寸", "重量", "保修期",
             "过电压类别", "机构批准", "湿度", "输入阻抗", "共模抑制比", "常规模式抑制比",
             "Lo-Z", "自动关机", "低电压显示", "浪涌", "峰值", "响应", "占空"]
    for f in sorted(funcs, key=len, reverse=True):
        t = re.sub(r'(?<![A-Za-z0-9])(' + re.escape(f) + r')', r'\n\1', t)
    lines = [l.strip() for l in t.split("\n") if l.strip()]
    blocks = []
    for l in lines:
        if l.startswith("<<H>>"):
            blocks.append({"h": l[5:]})
            continue
        mv = re.match(r'^([^\d]+?)([\d\-].*)$', l)
        if mv and len(mv.group(1)) <= 24 and not re.match(r'^[0-9]', l) and not l.startswith("Fluke "):
            blocks.append({"name": mv.group(1).strip(), "val": mv.group(2).strip()})
        else:
            blocks.append({"h": l})
    out = []
    for b in blocks:
        if "h" in b:
            out.append(f"<tr class='sg'><td colspan='2'><b>{esc(b['h'])}</b></td></tr>")
        elif "val" in b:
            out.append(f"<tr><td class='pn'>{esc(b['name'])}</td><td>{esc(b['val'])}</td></tr>")
    if not out:
        return None
    return "<table class='spec-table'><tbody>" + "".join(out) + "</tbody></table>"

def parse_en_models(text):
    """英文选型 -> 2列HTML表格（型号 | 包含内容）"""
    if not text:
        return None
    t = re.sub(r'^Models?:?\s*', '', text).strip()
    if len(t) < 4:
        return None
    t = re.sub(r'([^\n])(Includes?[:：]|In the box[:：]|Buy it[:：]?)', r'\1\n\2', t, flags=re.I)
    t = re.sub(r'([^\n])(Model[s]?[:：])', r'\1\n\2', t, flags=re.I)
    lines = [l.strip() for l in t.split("\n") if l.strip() and not re.match(r'^Includes?[:：]', l, re.I)]
    rows = []
    content = ""
    for l in lines:
        m = re.match(r'^(Model[s]?|型号)[:：]\s*(.+)$', l, re.I)
        if m:
            rows.append((m.group(2).strip(), content or "-"))
            content = ""
            continue
        if "includes" in l.lower()[:12] or "buy it" in l.lower()[:8]:
            content = re.sub(r'^(Includes?|Buy it)[:：]?\s*', '', l, flags=re.I)
            continue
        if rows:
            rows[-1] = (rows[-1][0], (rows[-1][1] + " " + l).strip() if rows[-1][1] != "-" else l)
        else:
            rows.append((l, "-"))
    if not rows:
        return None
    trs = "".join(f"<tr><td class='m'>{esc(m)}</td><td>{esc(c)}</td></tr>" for m, c in rows)
    return "<table class='selection-table'><thead><tr><th>Model</th><th>In the Box</th></tr></thead><tbody>" + trs + "</tbody></table>"

def parse_cn_models(text):
    """中文选型 -> 2列HTML表格（型号 | 配置/包含内容）"""
    if not text:
        return None
    t = text.strip()
    if len(t) < 4:
        return None
    # 型号块 / 包含块切分（保留"型号:"做锚点；Fluke 型号名前加换行）
    t = re.sub(r'([^\n])(型号[:：])', r'\1\n\2', t)
    t = re.sub(r'([^\n])(包括[:：]|包含[:：])', r'\1\n\2', t)
    t = re.sub(r'([^\n])(?=Fluke\s)', r'\1\n', t)
    lines = [l.strip() for l in t.split("\n") if l.strip()]
    rows = []
    model = None
    content = ""
    for l in lines:
        m = re.match(r'^型号[:：]\s*(.*)$', l)
        m2 = re.match(r'^(包括|包含)[:：]\s*(.*)$', l)
        if m:
            if model:
                rows.append((model, content or "-"))
            model = m.group(1).strip()
            content = ""
        elif m2:
            content = m2.group(2).strip()
        elif model and re.match(r'^Fluke\s', l) and len(l) <= 40:
            # 新型号名（Fluke 开头且短）→ 追加为新行
            if content:
                rows.append((model, content))
            model = l
            content = ""
        elif model:
            content = (content + " " + l).strip()
        else:
            model = l
    if model:
        rows.append((model, content or "-"))
    if not rows:
        return None
    trs = "".join(f"<tr><td class='m'>{esc(m)}</td><td>{esc(c)}</td></tr>" for m, c in rows)
    return "<table class='selection-table'><thead><tr><th>型号</th><th>配置/包含</th></tr></thead><tbody>" + trs + "</tbody></table>"

# ---- 测试模式 ----
if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "en"
    if mode == "en":
        d = json.load(open("E:/cxy/flk_clamp_en.json", encoding="utf-8"))
        for slug in ["fluke-301d"]:
            rec = d.get(slug, {})
            if isinstance(rec, dict) and rec.get("spec"):
                print("=== SPEC HTML ===")
                print(parse_en_spec(rec["spec"])[:1500])
            if isinstance(rec, dict) and rec.get("models"):
                print("=== MODELS HTML ===")
                print(parse_en_models(rec["models"])[:800])
