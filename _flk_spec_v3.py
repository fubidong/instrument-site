# -*- coding: utf-8 -*-
"""三列规格解析器：功能 | 量程/分辨率 | 基本精度（对齐官网展示）"""
import re, html

def esc(s):
    return html.escape(s, quote=False)

FUNCS = ["交流电压（毫伏）", "直流电压（毫伏）", "交流电压", "直流电压", "交流电流", "直流电流",
         "交流毫伏", "直流毫伏", "电阻（欧姆）", "电阻", "电容", "频率", "占空比", "通断性",
         "二极管测试", "二极管", "温度（不含探头）", "背光灯", "电池类型", "电池寿命",
         "工作温度", "存放温度", "存储温度", "最高电压", "过电压保护", "显示屏", "尺寸", "重量",
         "保修期", "过电压类别", "机构批准", "相对湿度", "工作湿度", "存放湿度", "输入阻抗", "共模抑制比",
         "常规模式抑制比", "振动", "撞击", "电磁兼容性", "电导", "读数存储器", "记录存储器",
         "屏幕显示", "连通性", "连接性", "隔离光纤", "自动/触控保持", "最小值-最大值-平均值",
         "电池/保险丝", "计时时钟", "日历钟", "直流 mV 分辨率", "兆欧量程"]

def parse_cn_spec_v3(text):
    """把"功能+量程/分辨率+基本精度"紧凑文本解析为三列表格"""
    if not text:
        return None
    t = re.sub(r'^产品规格[:：]?\s*', '', text).strip()
    if len(t) < 8:
        return None
    # 表头切分（长先短，避免子串误切）
    headers = ["技术指标功能", "通用技术指标", "精度规格", "技术规格", "技术指标"]
    for h in headers:
        t = re.sub(r'(' + re.escape(h) + r')', r'\n<<H>>\1', t)
    # 量程/分辨率、基本精度 前换行
    t = re.sub(r'([^\n])(量程/分辨率)', r'\1\n\2', t)
    t = re.sub(r'([^\n])(基本精度)', r'\1\n\2', t)
    # 功能名前换行（长先短后）
    for f in sorted(FUNCS, key=len, reverse=True):
        t = re.sub(r'(?<![A-Za-z0-9])(' + re.escape(f) + r')', r'\n\1', t)
    lines = [l.strip() for l in t.split("\n") if l.strip()]
    tokens = []
    for l in lines:
        if l.startswith("<<H>>"):
            tokens.append(("h", l[5:]))
        elif l.startswith("量程/分辨率"):
            tokens.append(("range", l[len("量程/分辨率"):].strip()))
        elif l.startswith("基本精度"):
            tokens.append(("acc", l[len("基本精度"):].strip()))
        else:
            tokens.append(("name", l))
    # 组合：h 输出分组；name 后跟 range+acc → 三列；否则两列
    out = []
    i = 0
    n = len(tokens)
    while i < n:
        kind, val = tokens[i]
        if kind == "h":
            if val.strip():
                out.append(f"<tr class='sg'><td colspan='3'><b>{esc(val)}</b></td></tr>")
            i += 1
            continue
        if kind == "name":
            # 产品名/叙述行 → 分组标题
            if val.startswith("Fluke ") and len(val) > 12:
                out.append(f"<tr class='sg'><td colspan='3'><b>{esc(val)}</b></td></tr>")
                i += 1
                continue
            rng = ""
            acc = ""
            j = i + 1
            if j < n and tokens[j][0] == "range":
                rng = tokens[j][1]
                j += 1
                if j < n and tokens[j][0] == "acc":
                    acc = tokens[j][1]
                    j += 1
            if rng or acc:
                out.append(f"<tr><td class='pn'>{esc(val)}</td><td class='rng'>{esc(rng)}</td><td class='acc'>{esc(acc)}</td></tr>")
                i = j
                continue
            # 无 rng/acc 的行：合并三列（参数名+值同一格，允许换行）
            p2 = val
            for f in sorted(FUNCS, key=len, reverse=True):
                if p2.startswith(f) and len(p2) > len(f):
                    p2 = f + "：" + p2[len(f):].strip()
                    break
            out.append(f"<tr><td colspan='3' class='pn2'>{esc(p2)}</td></tr>")
            i += 1
            continue
        if kind == "range":
            out.append(f"<tr><td class='pn'>量程/分辨率</td><td class='rng'>{esc(val)}</td><td class='acc'></td></tr>")
        elif kind == "acc":
            out.append(f"<tr><td class='pn'>基本精度</td><td class='rng'></td><td class='acc'>{esc(val)}</td></tr>")
        i += 1
    if not out:
        return None
    return ("<table class='spec-table spec-3col'><thead><tr><th>功能</th><th>量程/分辨率</th><th>基本精度</th></tr></thead>"
            "<tbody>" + "".join(out) + "</tbody></table>")
