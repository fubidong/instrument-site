# -*- coding: utf-8 -*-
"""从英文站 scan JSON 的 imgs 下载主图
用法: python _flk_imgs_en.py <en_scan.json> <out.json> <prefix>
"""
import json, os, sys, time, urllib.request

EN = json.load(open(sys.argv[1], encoding="utf-8"))
OUT = sys.argv[2]
PREFIX = sys.argv[3]
OD = "E:/cxy/instrument-site/public/uploads/product/2026/flk"
os.makedirs(OD, exist_ok=True)
HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://www.fluke.com/"}

mapping = {}
total = 0
for slug, rec in EN.items():
    if not isinstance(rec, dict) or rec.get("error") or not rec.get("imgs"):
        continue
    saved = []
    seen = set()
    for i, u in enumerate(rec["imgs"]):
        if not isinstance(u, str) or not u.startswith("http"):
            continue
        if u in seen:
            continue
        seen.add(u)
        fn = f"{PREFIX}_{slug.replace('-','_')}_{len(saved)+1}.jpg"
        fp = os.path.join(OD, fn)
        try:
            req = urllib.request.Request(u, headers=HEADERS)
            raw = urllib.request.urlopen(req, timeout=30).read()
            if len(raw) < 3000:
                print(f"  SKIP small {fn} {len(raw)}", flush=True)
                continue
            open(fp, "wb").write(raw)
            saved.append(f"/uploads/product/2026/flk/{fn}")
            total += 1
        except Exception as e:
            print(f"  ERR {slug} {fn} {str(e)[:50]}", flush=True)
        time.sleep(0.5)
    if saved:
        mapping[slug] = saved
    print(f"{slug}: {len(saved)} imgs", flush=True)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=1)
print("DONE total imgs:", total)
