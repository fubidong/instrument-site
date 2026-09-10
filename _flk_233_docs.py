# -*- coding: utf-8 -*-
"""查 Document 表含 233 的记录 + uploads 目录 PDF"""
import psycopg2, glob, os

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute("SELECT id, title, \"docType\", \"productId\" FROM \"Document\" WHERE title LIKE '%233%'")
rows = cur.fetchall()
print("docs title like 233:", len(rows))
for r in rows:
    print(" ", r)
cur.close()
conn.close()

print("\nuploads docs 233 files:")
for f in glob.glob("E:/cxy/instrument-site/public/uploads/docs/2026/*233*"):
    print(" ", os.path.basename(f), os.path.getsize(f))
