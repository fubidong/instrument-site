# -*- coding: utf-8 -*-
"""补 Fluke 301B/301C 主图：curl 英文站页面提取 media.fluke.com 图片并入库"""
import json, os, re, time, urllib.request, urllib.parse

def curl(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "ignore")

def extract(url):
    try:
        h = curl(url)
    except Exception as e:
        print("  curl ERR", str(e)[:60])
        return []
    imgs = []
    for m in re.finditer(r'https://media\.fluke\.com/([a-z0-9-]+?)_original[^"\\ ]*\.jpg', h):
        u = m.group(0)
        if u not in imgs:
            imgs.append(u)
    return imgs

OD = "E:/cxy/instrument-site/public/uploads/product/2026/flk"
os.makedirs(OD, exist_ok=True)
model_map = {"301b": "Fluke 301B", "301c": "Fluke 301C"}
for slug in ("301b", "301c"):
    page = f"https://www.fluke.com/en/product/electrical-testing/clamp-meters/{slug}"
    imgs = extract(page)
    print(slug, "imgs:", len(imgs))
    if not imgs:
        continue
    saved = []
    for i, u in enumerate(imgs[:4]):
        fn = f"FLK_CLAMP_{slug}_{i+1}.jpg"
        fp = os.path.join(OD, fn)
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.fluke.com/"})
            raw = urllib.request.urlopen(req, timeout=40).read()
            if len(raw) < 3000:
                print("  SKIP small", len(raw))
                continue
            open(fp, "wb").write(raw)
            saved.append(f"/uploads/product/2026/flk/{fn}")
        except Exception as e:
            print("  DL ERR", str(e)[:60])
        time.sleep(0.5)
    print("  saved:", len(saved))
    json.dump({"301b": saved} if slug == "301b" else {"301c": saved}, open(f"E:/cxy/flk_{slug}_imgsfix.json", "w"))
