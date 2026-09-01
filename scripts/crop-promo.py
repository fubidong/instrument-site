# 全量处理：检测促销水印区并裁剪，保留干净产品图
# 用法: python scripts/crop-promo.py [--limit N] [--dry]
import os, sys, json
from PIL import Image

ROOT = r"E:\cxy\instrument-site\public"

def is_redish(px):
    r, g, b = px
    return r > 140 and r > g * 1.4 and r > b * 1.4

def promo_ratio(px, y, w, step=3):
    total = 0; red = 0
    for x in range(0, w, step):
        total += 1
        if is_redish(px[x, y]):
            red += 1
    return red / total if total else 0

def find_promo_top(im):
    """返回促销区顶边 y（无则 None）。
    从底部向上，找到红色占比>6% 的最高连续区（允许底部少量 padding 与 2px 内间隙）"""
    w, h = im.size
    px = im.load()
    promo_top = None
    non_red = 0
    for y in range(h - 1, -1, -1):
        if promo_ratio(px, y, w) > 0.06:
            promo_top = y
            non_red = 0
        else:
            non_red += 1
            if non_red >= 3 and promo_top is not None:
                break
    return promo_top

def process(path, dry=False):
    try:
        im = Image.open(path).convert("RGB")
    except Exception as e:
        return ("ERR", str(e)[:40])
    w, h = im.size
    if h < 300:
        return ("SMALL", f"{w}x{h}")
    top = find_promo_top(im)
    if top is None or top / h > 0.92:
        return ("CLEAN", f"{w}x{h}")
    crop_h = top  # 裁到促销区顶边
    # 避免裁太多：若促销区顶边高于 55%（即促销区 >45%），视为误判，保守处理
    if top / h < 0.55:
        return ("SKIP_LARGE_PROMO", f"top={top/h:.2f}")
    if not dry:
        im.crop((0, 0, w, crop_h)).save(path)
    return ("CROPPED", f"{w}x{h}->{crop_h}")

def main():
    args = sys.argv[1:]
    dry = "--dry" in args
    limit = None
    for a in args:
        if a.startswith("--limit="):
            limit = int(a.split("=")[1])
    # 从 DB 读 coverImage
    import subprocess
    sql = 'SELECT "coverImage" FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code=\'SIGLENT\')'
    js = r'''
    const {Client}=require("pg");
    (async()=>{const c=new Client({connectionString:"postgresql://postgres:postgres@localhost:5432/instrument_site"});await c.connect();
    const r=await c.query(%s);console.log(JSON.stringify(r.rows.map(x=>x.coverImage)));await c.end();})();
    ''' % json.dumps(sql)
    tmp = r"E:\cxy\instrument-site\scripts\_cov_tmp.cjs"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(js)
    out = subprocess.run(["node", tmp], capture_output=True, text=True, cwd=r"E:\cxy\instrument-site")
    try:
        covers = json.loads(out.stdout.strip().split("\n")[0])
    except Exception as e:
        print("DB 读取失败:", out.stderr[:300], str(e))
        return
    stats = {"CROPPED": 0, "CLEAN": 0, "ERR": 0, "SMALL": 0, "SKIP_LARGE_PROMO": 0}
    cropped_list = []
    n = 0
    for cv in covers:
        if not cv:
            continue
        p = os.path.join(ROOT, cv.lstrip("/"))
        if not os.path.exists(p):
            print("缺文件:", cv)
            continue
        tag, info = process(p, dry=dry)
        stats[tag] = stats.get(tag, 0) + 1
        if tag == "CROPPED":
            cropped_list.append(cv.split("/")[-1])
        n += 1
        if limit and n >= limit:
            break
    print("dry:", dry, "| 处理", n, "张")
    print("统计:", stats)
    print("\n裁剪清单(前30):")
    for f in cropped_list[:30]:
        print("  ", f)
    if len(cropped_list) > 30:
        print("  ... 共", len(cropped_list), "张")

if __name__ == "__main__":
    main()
