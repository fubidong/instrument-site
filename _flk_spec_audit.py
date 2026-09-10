# -*- coding: utf-8 -*-
"""排查福禄克 specsOverview 状态"""
import psycopg2, re

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    '''SELECT p.model, pt.locale, pt."specsOverview" FROM "ProductTranslation" pt
       JOIN "Product" p ON p.id=pt."productId"
       WHERE p."brandId"=%s''',
    ("92c09b46-32f6-4425-bf3b-0bd4825da642",),
)
rows = cur.fetchall()
print("total translations:", len(rows))

not_html = []
empty = []
html_ok = []
short = []
for model, loc, spec in rows:
    s = spec or ""
    if not s.strip():
        empty.append((model, loc))
    elif not s.lstrip().startswith("<"):
        not_html.append((model, loc, s[:80]))
    elif "<table" not in s:
        short.append((model, loc, s[:60]))
    else:
        html_ok.append((model, loc, len(s)))

print("empty:", len(empty))
print("not-html (compact text):", len(not_html))
print("html but no <table>:", len(short))
print("html table OK:", len(html_ok))

print("\n--- NOT HTML samples (first 25) ---")
for m, l, s in not_html[:25]:
    print(f"  [{l}] {m}: {s!r}")

print("\n--- HTML but no table samples (first 25) ---")
for m, l, s in short[:25]:
    print(f"  [{l}] {m}: {s!r}")

print("\n--- html table len stats ---")
lens = sorted([x[2] for x in html_ok])
print("count:", len(lens), "min:", lens[0] if lens else 0, "max:", lens[-1] if lens else 0)
# 找出长度异常小的表格（可能解析差）
tiny = [x for x in html_ok if x[2] < 100]
print("tiny tables (<100 chars):", len(tiny))
for m, l, n in tiny[:15]:
    print(f"  [{l}] {m} len={n}")
cur.close()
conn.close()
