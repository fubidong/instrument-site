# -*- coding: utf-8 -*-
"""补 Fluke 301B/301C 主图：中文站页面提取 media.fluke.com 图片 → 下载 → 写 DB"""
import json, os, re, time, urllib.request, urllib.parse, subprocess

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.fluke.com.cn/"})
    return urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "ignore")

OD = "E:/cxy/instrument-site/public/uploads/product/2026/flk"
os.makedirs(OD, exist_ok=True)
out = {}
for slug in ("301b", "301c"):
    url = "https://www.fluke.com.cn/product/" + urllib.parse.quote("电气测试/钳形表/" + slug)
    try:
        h = fetch(url)
    except Exception as e:
        print(slug, "ERR", str(e)[:60])
        continue
    imgs = list(dict.fromkeys(re.findall(r"https://media\.fluke\.com/[a-z0-9-]+?_[^\"\\ ]*\.jpg", h)))
    print(slug, "imgs:", len(imgs))
    saved = []
    for i, u in enumerate(imgs[:4]):
        fn = f"FLK_CLAMP_{slug}_{i+1}.jpg"
        fp = os.path.join(OD, fn)
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.fluke.com.cn/"})
            raw = urllib.request.urlopen(req, timeout=40).read()
            if len(raw) < 3000:
                print("  SKIP small", len(raw))
                continue
            open(fp, "wb").write(raw)
            saved.append(f"/uploads/product/2026/flk/{fn}")
        except Exception as e:
            print("  DL ERR", str(e)[:60])
        time.sleep(0.5)
    out[slug] = saved
    print("  saved:", len(saved))
with open("E:/cxy/flk_301fix.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
print("DONE")
