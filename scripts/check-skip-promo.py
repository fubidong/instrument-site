# 查看促销区占比>45% 的图（SKIP_LARGE_PROMO 候选）
from PIL import Image
import os, json, subprocess

def is_redish(px):
    r, g, b = px
    return r > 140 and r > g * 1.4 and r > b * 1.4

def find_promo_top(im):
    w, h = im.size
    px = im.load()
    promo_top = None
    for y in range(h - 1, 0, -1):
        red = sum(1 for x in range(0, w, 3) if is_redish(px[x, y]))
        if red / (w // 3 + 1) > 0.05:
            promo_top = y
        else:
            if promo_top is not None:
                break
    return promo_top

ROOT = r"E:\cxy\instrument-site\public"
sql = 'SELECT "coverImage" FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code=\'SIGLENT\')'
js = '''
const {Client}=require("pg");
(async()=>{const c=new Client({connectionString:"postgresql://postgres:postgres@localhost:5432/instrument_site"});await c.connect();
const r=await c.query(%s);console.log(JSON.stringify(r.rows.map(x=>x.coverImage)));await c.end();})();
''' % json.dumps(sql)
with open(r"E:\cxy\instrument-site\scripts\_cov_tmp.cjs", "w", encoding="utf-8") as f:
    f.write(js)
out = subprocess.run(["node", r"E:\cxy\instrument-site\scripts\_cov_tmp.cjs"], capture_output=True, text=True, cwd=r"E:\cxy\instrument-site")
covers = json.loads(out.stdout.strip().split("\n")[0])
for cv in covers:
    p = os.path.join(ROOT, cv.lstrip("/"))
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert("RGB")
    w, h = im.size
    if h < 300:
        continue
    top = find_promo_top(im)
    if top is not None and 0 < top / h < 0.55:
        print(f"{os.path.basename(cv)}: {w}x{h} top={top} ({top/h:.2f})")
