# -*- coding: utf-8 -*-
"""福禄克万用表高清主图批量下载"""
import json, os, re, time, urllib.request, urllib.parse

with open("E:/cxy/flk_dmm_scan.json", encoding="utf-8") as f:
    data = json.load(f)

OUT = "E:/cxy/instrument-site/public/uploads/product/2026/flk"
os.makedirs(OUT, exist_ok=True)

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
    # 只取高清原图（_original__size 或 _product_slideshow_main）
    urls = []
    for u in imgs:
        if isinstance(u, str) and u.startswith("http"):
            urls.append(u)
    seen = set()
    saved = []
    for i, u in enumerate(urls):
        if u in seen:
            continue
        seen.add(u)
        ext = ".jpg"
        fn = f"{slug}_{i+1}{ext}"
        fp = os.path.join(OUT, fn)
        try:
            req = urllib.request.Request(u, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read()
            if len(raw) < 3000:
                print(f"  SKIP small {fn} {len(raw)}")
                continue
            with open(fp, "wb") as wf:
                wf.write(raw)
            saved.append(f"/uploads/product/2026/flk/{fn}")
            total += 1
        except Exception as e:
            print(f"  ERR {fn} {e}")
        time.sleep(0.5)
    if saved:
        mapping[slug] = saved
    print(f"{slug}: {len(saved)} imgs")

with open("E:/cxy/flk_dmm_imgs.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=1)
print("DONE total imgs:", total)
