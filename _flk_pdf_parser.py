# -*- coding: utf-8 -*-
"""从福禄克 PDF 提取技术规格表并生成 HTML"""
import fitz, re, os, json

def extract_spec_from_pdf(pdf_path):
    """从 PDF 提取精度规格表，返回 HTML 表格"""
    if not os.path.exists(pdf_path):
        return None
    doc = fitz.open(pdf_path)
    full_text = ""
    spec_pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if ("精度规格" in text or "技术指标" in text or "Specifications" in text) and \
           ("量程" in text or "Range" in text or "分辨率" in text or "Resolution" in text):
            spec_pages.append(i)
            full_text += text + "\n"
    doc.close()
    if not full_text:
        return None
    return full_text


def parse_pdf_spec_to_table(text):
    """把 PDF 提取的规格文本解析成 HTML 表格
    格式：功能 | 量程 | 分辨率 | 精度1 | 精度2
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    # 找表头位置
    header_idx = -1
    for i, line in enumerate(lines):
        if line in ('功能', 'Function') and i + 4 < len(lines):
            if lines[i+1] in ('量程', 'Range') and lines[i+2] in ('分辨率', 'Resolution'):
                header_idx = i
                break
    if header_idx < 0:
        return None

    # 精度列名（可能是 15B MAX / 17B MAX 等）
    acc_cols = []
    j = header_idx + 3
    while j < len(lines) and j < header_idx + 6:
        if lines[j] not in ('精度', 'Accuracy', ''):
            acc_cols.append(lines[j])
        j += 1

    # 从表头后开始解析
    rows = []
    i = header_idx + 3 + len(acc_cols)

    # 功能名模式：中文短语或英文短语，后面跟一个单字母符号（K/u/M/V/g/l/a/e/n/b/O/T/Ω/N 等）
    func_pattern = re.compile(r'^[\u4e00-\u9fffA-Za-z（）()/]+$')

    while i < len(lines):
        line = lines[i]
        # 跳过页脚/页眉
        if line in ('用户手册', 'Digital Multimeters', '技术指标') or re.match(r'^\d+$', line):
            i += 1
            continue
        # 跳过注释行
        if line.startswith('所有的') or line.startswith('10 A') or line.startswith('注') or line.startswith('Note'):
            i += 1
            continue

        # 功能名：中文/英文短语
        if func_pattern.match(line) and len(line) > 1 and not re.match(r'^[\d.]', line):
            func_name = line
            i += 1
            # 下一行可能是符号（K/u/M/V等单字母）或量程
            if i < len(lines) and len(lines[i]) <= 2 and not re.match(r'^[\d.]', lines[i]):
                i += 1  # 跳过符号

            # 收集量程（数字+单位）
            ranges = []
            while i < len(lines) and re.match(r'^[\d]', lines[i]):
                ranges.append(lines[i])
                i += 1

            # 收集分辨率
            resolutions = []
            while i < len(lines) and re.match(r'^[\d]', lines[i]):
                resolutions.append(lines[i])
                i += 1

            # 收集精度（可能有 acc_cols 个）
            accuracies = []
            for _ in range(len(acc_cols)):
                if i < len(lines):
                    accuracies.append(lines[i])
                    i += 1

            if ranges or resolutions:
                rows.append({
                    'func': func_name,
                    'range': '<br>'.join(ranges),
                    'resolution': '<br>'.join(resolutions),
                    'acc': accuracies,
                })
        else:
            i += 1

    if not rows:
        return None

    # 生成 HTML
    n_acc = len(acc_cols)
    html = ['<table class="spec-table" style="width:100%;border-collapse:collapse;font-size:13px;">']
    html.append('<thead><tr style="background:#f1f5f9;">')
    html.append('<th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left;">功能</th>')
    html.append('<th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left;">量程</th>')
    html.append('<th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left;">分辨率</th>')
    for col in acc_cols:
        html.append(f'<th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left;">{col}</th>')
    html.append('</tr></thead><tbody>')

    for idx, r in enumerate(rows):
        bg = 'background:#f8fafc;' if idx % 2 == 0 else ''
        html.append(f'<tr style="{bg}">')
        html.append(f'<td style="border:1px solid #e2e8f0;padding:6px 8px;font-weight:500;">{r["func"]}</td>')
        html.append(f'<td style="border:1px solid #e2e8f0;padding:6px 8px;white-space:pre-line;">{r["range"]}</td>')
        html.append(f'<td style="border:1px solid #e2e8f0;padding:6px 8px;white-space:pre-line;">{r["resolution"]}</td>')
        for a in r['acc']:
            html.append(f'<td style="border:1px solid #e2e8f0;padding:6px 8px;">{a}</td>')
        for _ in range(n_acc - len(r['acc'])):
            html.append('<td style="border:1px solid #e2e8f0;padding:6px 8px;"></td>')
        html.append('</tr>')
    html.append('</tbody></table>')
    return '\n'.join(html)


# 测试
if __name__ == "__main__":
    pdf = "E:/cxy/instrument-site/public/uploads/docs/2026/FLK_fluke_15b_max_1.pdf"
    text = extract_spec_from_pdf(pdf)
    if text:
        html = parse_pdf_spec_to_table(text)
        if html:
            print(html[:2000])
        else:
            print("解析失败")
            print(text[:500])
    else:
        print("未找到规格页")
