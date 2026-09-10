# -*- coding: utf-8 -*-
"""从中文站提取福禄克产品技术规格 HTML 表格"""
import re, psycopg2

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

def extract_spec_table(html):
    """从中文站 HTML 提取技术规格表格"""
    # 找技术规格表格
    # 格式：<div ...>技术规格</td></tr>...<table>...</table>
    # 或者直接找包含"技术规格"的表格块
    spec_start = html.find("技术规格")
    if spec_start < 0:
        return None

    # 从技术规格后找第一个 <table
    table_start = html.find("<table", spec_start)
    if table_start < 0:
        return None

    # 找表格结束
    table_end = html.find("</table>", table_start)
    if table_end < 0:
        return None
    table_end += len("</table>")

    table_html = html[table_start:table_end]
    # 清理属性
    table_html = re.sub(r'style="[^"]*"', '', table_html)
    table_html = re.sub(r'colspan="[^"]*"', '', table_html)
    table_html = re.sub(r'rowspan="[^"]*"', '', table_html)
    table_html = re.sub(r'\s+', ' ', table_html)
    return table_html


# 测试 374
html = open("E:/cxy/_374_cn.html", encoding="utf-8", errors="ignore").read()
spec_table = extract_spec_table(html)
if spec_table:
    print("提取成功，长度:", len(spec_table))
    print(spec_table[:500])
    print("...")

    # 更新 DB
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
    cur = conn.cursor()
    cur.execute(
        """SELECT id FROM "Product" WHERE "brandId"=%s AND model='Fluke 374'""",
        (BRAND,),
    )
    r = cur.fetchone()
    if r:
        pid = r[0]
        cur.execute(
            'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
            (spec_table, pid, "zh"),
        )
        conn.commit()
        print(f"已更新 Fluke 374 中文规格 (pid={pid})")
    cur.close()
    conn.close()
else:
    print("未找到技术规格表格")
