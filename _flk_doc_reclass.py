# -*- coding: utf-8 -*-
"""按标题重新分类福禄克文档 docType（datasheet/user_manual/quick_guide/other）"""
import psycopg2, re

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    'SELECT d.id, d.title FROM "Document" d JOIN "Product" p ON p.id=d."productId" WHERE p."brandId"=%s',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
rows = cur.fetchall()

def classify(title):
    t = title.lower()
    # 规格数据表
    if re.search(r"datasheet|data ?sheet|specification|规格书|数据表|技术资料|规格表", t):
        return "datasheet"
    # 快速参考指南
    if re.search(r"quick ?(reference|guide)|快速参考|参考指南|快速指南|quickref", t):
        return "quick_guide"
    # 用户手册
    if re.search(r"users? manual|user ?manual|用户手册|使用手册|操作手册|手册|manual", t):
        return "user_manual"
    # 补遗/补充
    if re.search(r"supplement|补遗|补充|addendum", t):
        return "user_manual"
    # 彩页/宣传
    if re.search(r"brochure|leaflet|彩页|宣传|产品介绍|overview", t):
        return "other"
    return "other"

cnt = {}
upd = 0
for doc_id, title in rows:
    newt = classify(title or "")
    if newt:
        cur.execute('UPDATE "Document" SET "docType"=%s WHERE id=%s', (newt, doc_id))
        cnt[newt] = cnt.get(newt, 0) + 1
        upd += 1
conn.commit()
print("updated:", upd)
for k, v in cnt.items():
    print(" ", k, v)
cur.close()
conn.close()
