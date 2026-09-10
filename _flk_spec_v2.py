# -*- coding: utf-8 -*-
"""福禄克英文 spec 保守格式化器
- 去掉 Specifications: 前缀和产品名
- 按功能名分段（大写开头短语 + Range）
- 每段：功能名加粗，Range/Resolution/Accuracy 各一行（两列）
- 保留原始值，不拆分不合并
"""
import re

def parse_en_spec_v2(spec):
    if not spec:
        return ""
    s = spec.strip()
    # 去掉 Specifications: 前缀
    s = re.sub(r'^Specifications:\s*', '', s, flags=re.IGNORECASE)
    # 去掉开头的产品名行（Fluke xxx ... 直到第一个大写功能词+Range）
    # 找到第一个 "Range" 前面的功能名起点
    # 先按 Range 分割
    parts = re.split(r'\s+(Range)\s+', s)
    if len(parts) < 3:
        # 没有 Range，直接返回纯文本
        return f"<div class='spec-plain'>{_esc(s)}</div>"

    html = ["<table class='spec-table'><tbody>"]
    # parts[0] = 前缀（产品名+第一个功能名）
    # parts[1] = "Range"
    # parts[2] = Range值 + Resolution + Accuracy + 下一个功能名
    # ...

    # 重组：把 "Range" 和后面的值合并
    segments = []
    current_name = parts[0].strip()
    i = 1
    while i < len(parts):
        if parts[i] == "Range":
            # 值部分 = parts[i+1]，包含 Range值/Resolution/Accuracy/下一个功能名
            val_part = parts[i+1] if i+1 < len(parts) else ""
            # 从 val_part 中提取下一个功能名（最后一个大写开头的短语）
            # 下一个功能名在 Accuracy 值之后
            # 找 "Resolution" 和 "Accuracy" 的位置
            res_match = re.search(r'\s+Resolution\s+', val_part)
            acc_match = re.search(r'\s+Accuracy\s+', val_part)

            range_val = ""
            res_val = ""
            acc_val = ""
            next_name = ""

            if res_match and acc_match:
                range_val = val_part[:res_match.start()].strip()
                res_val = val_part[res_match.end():acc_match.start()].strip()
                rest = val_part[acc_match.end():]
                # rest 包含 Accuracy值 + 下一个功能名
                # 下一个功能名是最后一个大写开头的短语（后面可能跟 Range）
                # 找最后一个大写词开头的位置
                next_match = re.search(r'\s+([A-Z][a-zA-Z0-9\/\(\)&, ]+?)\s*$', rest)
                if next_match:
                    acc_val = rest[:next_match.start()].strip()
                    next_name = next_match.group(1).strip()
                else:
                    acc_val = rest.strip()
            elif res_match:
                range_val = val_part[:res_match.start()].strip()
                res_val = val_part[res_match.end():].strip()
            elif acc_match:
                range_val = val_part[:acc_match.start()].strip()
                acc_val = val_part[acc_match.end():].strip()
            else:
                range_val = val_part.strip()

            # 清理功能名：去掉产品名前缀（Fluke xxx）
            name = current_name
            # 如果功能名包含 "Electrical Specifications" 等，去掉
            name = re.sub(r'^Fluke\s+\S+\s+', '', name)
            name = re.sub(r'Electrical Specifications\s*', '', name, flags=re.IGNORECASE)
            name = name.strip()

            if name:
                html.append(f"<tr class='sg'><td colspan='2'><b>{_esc(name)}</b></td></tr>")
            if range_val:
                html.append(f"<tr><td class='sk'>Range</td><td>{_esc(range_val)}</td></tr>")
            if res_val:
                html.append(f"<tr><td class='sk'>Resolution</td><td>{_esc(res_val)}</td></tr>")
            if acc_val:
                html.append(f"<tr><td class='sk'>Accuracy</td><td>{_esc(acc_val)}</td></tr>")

            current_name = next_name
            i += 2
        else:
            i += 1

    html.append("</tbody></table>")
    return "\n".join(html)

def _esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# 测试
if __name__ == "__main__":
    import json
    d = json.load(open("E:/cxy/flk_clamp_en.json", encoding="utf-8"))
    for slug in ["fluke-374", "fluke-301d"]:
        print(f"\n{'='*60}")
        print(f"=== {slug} ===")
        spec = d[slug]["spec"]
        html = parse_en_spec_v2(spec)
        print(html[:1500])
