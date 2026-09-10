# -*- coding: utf-8 -*-
"""统计无文档产品中英文站 sitemap 有对应的数量"""
import psycopg2, json, re

en = json.load(open("E:/cxy/flk_en_products.json", encoding="utf-8"))
en_slugs = set(x["slug"] for x in en)
en_urls = set((x.get("url") or "").lower() for x in en)

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.model FROM "Product" p WHERE p."brandId"=%s AND p."isActive"=true
       AND NOT EXISTS (SELECT 1 FROM "Document" d WHERE d."productId"=p.id) ORDER BY p.model''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
rows = cur.fetchall()
cur.close()
conn.close()
print("no-doc products:", len(rows))

# 尝试匹配：model 提取数字/字母 slug
def norm(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

matched = []
unmatched = []
for model, in rows:
    n = norm(model)
    if n in en_slugs:
        matched.append((model, n))
    else:
        unmatched.append(model)
print("matched EN slug:", len(matched))
for m, n in matched[:30]:
    print("  ", m, "->", n)
print("\nunmatched count:", len(unmatched))
