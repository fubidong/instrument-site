# -*- coding: utf-8 -*-
import re, psycopg2

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

def extract_spec_table(html):
    spec_pos = html.find("技术规格")
    if spec_pos < 0:
        return None
    # 往前找最近的 <table
    table_start = html.rfind("<table", 0, spec_pos)
    if table_start < 0:
        return None
    # 往后找 </table>
    table_end = html.find("</table>", spec_pos)
    if table_end < 0:
        return None
    table_end += len("</table>")
    table_html = html[table_start:table_end]
    # 清理内联样式但保留结构
    table_html = re.sub(r'style="[^"]*"', '', table_html)
    table_html = re.sub(r'\s+', ' ', table_html)
    return table_html

html = open("E:/cxy/_374_cn.html", encoding="utf-8", errors="ignore").read()
spec_table = extract_spec_table(html)
if spec_table:
    print("长度:", len(spec_table))
    print(spec_table[:300])
    print("...")
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
    cur = conn.cursor()
    cur.execute("""SELECT id FROM "Product" WHERE "brandId"=%s AND model='Fluke 374'""", (BRAND,))
    r = cur.fetchone()
    if r:
        cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s', (spec_table, r[0], "zh"))
        conn.commit()
        print("已更新 374 中文规格")
    cur.close()
    conn.close()
else:
    print("未找到")
