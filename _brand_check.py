# -*- coding: utf-8 -*-
"""查品牌 slug/路径与前台路由"""
import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
# 品牌表结构
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='Brand'")
print("Brand cols:", [r[0] for r in cur.fetchall()])
cur.execute('SELECT id, code, "sortOrder", "isActive" FROM "Brand" ORDER BY "sortOrder"')
for r in cur.fetchall():
    print(r)
cur.close()
conn.close()
