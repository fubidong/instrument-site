from PIL import Image
import psycopg2
import os, sys

def red3(p):
    try:
        img = Image.open(p).convert("RGB")
        img.thumbnail((300, 300))
        px = list(img.getdata())
        n = max(len(px), 1)
        red3 = sum(1 for r, g, b in px if r - g > 80 and r - b > 80 and r > 150)
        return round(red3 / n * 1000, 2)
    except Exception as e:
        return -1

conn = psycopg2.connect(host="localhost", port=5432, dbname="instrument_site", user="postgres", password="postgres")
cur = conn.cursor()
cur.execute("""SELECT model, "coverImage" FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')""")
rows = cur.fetchall()
print("总数:", len(rows))
suspicious = []
for model, cover in rows:
    if not cover:
        continue
    p = "E:/cxy/instrument-site/public" + cover
    r = red3(p)
    if r > 20:
        suspicious.append((model, cover, r))
print("疑似广告(red3>20):", len(suspicious))
for m, c, r in suspicious:
    print("  ", m, r, c)
conn.close()
