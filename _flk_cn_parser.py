# -*- coding: utf-8 -*-
"""中文 DMM spec 智能分段器
- 去掉表头（功能量程分辨率精度...）
- 按功能名（中文短语）分段
- 每段：功能名加粗，后面的值保留原样
- 生成简单 HTML，不做表格切分（保证内容完整）
"""
import re

def parse_cn_dmm_spec(spec):
    if not spec:
        return ""
    s = spec.strip()
    # 去掉 "产品规格: xxx" 前缀
    s = re.sub(r'^产品规格[:：]\s*', '', s)
    # 去掉开头的产品名行（Fluke xxx ... 技术规格）
    s = re.sub(r'^Fluke\s+\S+[^\n]*?技术规格\s*', '', s)
    # 去掉精度说明段落（精度在校准后...）
    s = re.sub(r'精度在校准后[^。]*。\s*', '', s)
    s = re.sub(r'精度规格采用以下形式[^。]*。\s*', '', s)

    # 功能名列表（DMM 常见功能）
    functions = [
        '交流电压', '直流电压', '交流电流', '直流电流', '电阻', '电容',
        '频率', '温度', '二极管测试', '通断性', '背光灯', '占空比',
        '毫伏', '毫安', '微安', '安培', '欧姆', '纳法', '皮法',
        '真有效值', '最大值', '最小值', '相对值', '数据保持',
        '交流电压（毫伏）', '直流电压（毫伏）',
        '交流电流 μA', '交流电流 mA', '交流电流 A',
        '直流电流 μA', '直流电流 mA', '直流电流 A',
        '电阻（欧姆）', '频率1', '占空比1', '通断性阈值',
        '工作温度', '储存温度', '相对湿度', '海拔', '震动', '冲击',
        '电磁兼容', '安全', '电池类型', '电池寿命', '尺寸', '重量',
        '保修期', '一般技术指标', '一般规格', '电气规格', '机械规格',
        '环境规格', '安全规格', 'EMC', 'LCD', '显示', '量程',
    ]

    # 在每个功能名前插入分隔符
    for fn in sorted(functions, key=len, reverse=True):
        # 功能名后面跟数字或括号
        pattern = re.escape(fn) + r'(?=[（(\d])'
        s = re.sub(pattern, '\n|||' + fn, s)

    # 分割
    parts = [p.strip() for p in s.split('\n|||') if p.strip()]

    html = ["<div class='spec-dmm-plain'>"]
    for part in parts:
        # 第一行是功能名，后面是值
        # 找功能名结束位置（第一个数字或"（"）
        m = re.match(r'^([^（(\d]+[）)]?)\s*(.*)$', part, re.DOTALL)
        if m:
            name = m.group(1).strip()
            value = m.group(2).strip()
            if name and value:
                html.append(f"<div class='spec-row'><span class='spec-name'>{name}</span><span class='spec-value'>{value}</span></div>")
            elif name:
                html.append(f"<div class='spec-group'>{name}</div>")
        else:
            html.append(f"<div class='spec-row'>{part}</div>")

    html.append("</div>")
    return "\n".join(html)


def parse_cn_models(models_text):
    """中文型号配置分段"""
    if not models_text:
        return ""
    s = models_text.strip()
    s = re.sub(r'^型号[:：]\s*', '', s)
    # 去掉开头的产品名
    s = re.sub(r'^Fluke\s+\S+[^\n]*?', '', s)

    # 型号模式：Fluke xxx-xx/CN 或 Fluke xxx KIT/CN
    # 在每个型号前插入分隔符
    pattern = r'(?=Fluke\s+\S+?(?:/CN|KIT|TP\s+KIT|数字万用表|防烧))'
    s = re.sub(pattern, '\n|||', s)

    parts = [p.strip() for p in s.split('\n|||') if p.strip()]

    html = ["<table class='selection-table'><thead><tr><th>型号</th><th>配置/包含</th></tr></thead><tbody>"]
    for part in parts:
        # 型号 = 开头到"数字万用表"或"防烧万用表"结束
        m = re.match(r'^(Fluke\s+\S+?)\s*(.*)$', part)
        if m:
            model = m.group(1).strip()
            config = m.group(2).strip()
            # 在配置里，"数字万用表"后面是配件列表
            config = re.sub(r'数字万用表', '数字万用表；', config)
            config = re.sub(r'防烧万用表', '防烧万用表；', config)
            config = re.sub(r'工具套装', '工具套装；', config)
            # 配件之间加分隔
            config = re.sub(r'(TL\d+|TP\d+|节\s*AA|用户手册|磁性挂件|绝缘十字螺丝刀|保护帽)', r'；\1', config)
            config = re.sub(r'；+', '；', config).strip('；')
            html.append(f"<tr><td>{model}</td><td>{config}</td></tr>")
        else:
            html.append(f"<tr><td colspan='2'>{part}</td></tr>")
    html.append("</tbody></table>")
    return "\n".join(html)


# 测试
if __name__ == "__main__":
    import json
    d = json.load(open("E:/cxy/flk_dmm_tabs.json", encoding="utf-8"))
    spec = d["fluke-15b-max"]["spec"]
    print("=== SPEC ===")
    print(parse_cn_dmm_spec(spec)[:1500])
    print("\n=== MODELS ===")
    print(parse_cn_models(d["fluke-15b-max"]["models"])[:1000])
