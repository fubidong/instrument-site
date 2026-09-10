# -*- coding: utf-8 -*-
"""福禄克通用主图下载：用法 python _flk_imgs_gen.py <scan.json> <out.json>"""
import json, os, time, urllib.request, sys

SCAN = sys.argv[1]
OUTJ = sys.argv[2]

with open(SCAN, encoding="utf-8") as f:
    data = json.load(f)

OD = "E:/cxy/instrument-site/public/uploads/product/2026/flk"
os.makedirs(OD, exist_ok=True)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Referer": "https://www.fluke.com.cn/",
}

mapping = {}
total = 0
for slug, rec in data.items():
    if rec.get("error") or not rec.get("jsonld"):
        continue
    imgs = rec["jsonld"].get("imgs") or []
    urls = [u for u in imgs if isinstance(u, str) and u.startswith("http")]
    seen = set()
    saved = []
    for i, u in enumerate(urls):
        if u in seen:
            continue
        seen.add(u)
        fn = f"{slug}_{i+1}.jpg"
        fp = os.path.join(OD, fn)
        try:
            req = urllib.request.Request(u, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read()
            if len(raw) < 3000:
                print(f"  SKIP small {fn} {len(raw)}", flush=True)
                continue
            with open(fp, "wb") as wf:
                wf.write(raw)
            saved.append(f"/uploads/product/2026/flk/{fn}")
            total += 1
        except Exception as e:
            print(f"  ERR {fn} {str(e)[:60]}", flush=True)
        time.sleep(0.4)
    if saved:
        mapping[slug] = saved
    print(f"{slug}: {len(saved)} imgs", flush=True)

with open(OUTJ, "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=1)
print("DONE total imgs:", total)
