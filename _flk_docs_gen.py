# -*- coding: utf-8 -*-
"""福禄克通用手册下载：从 en scan JSON 的 docs 下载核心手册
用法: python _flk_docs_gen.py <en_scan.json> <out.json> <prefix>
"""
import json, os, re, sys, time, urllib.request

EN = json.load(open(sys.argv[1], encoding="utf-8"))
OUT = sys.argv[2]
PREFIX = sys.argv[3]  # 如 FLK_CLAMP

OD = "E:/cxy/instrument-site/public/uploads/docs/2026"
os.makedirs(OD, exist_ok=True)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Referer": "https://www.fluke.com/",
}
KEY = ["user manual", "datasheet", "technical", "quick reference", "data sheet", "specifications", "manual", "brochure"]

mapping = {}
downloaded = {}
total = 0
for slug, rec in EN.items():
    if not isinstance(rec, dict) or rec.get("error") or not rec.get("docs"):
        continue
    sel = []
    for d in rec["docs"]:
        t = (d.get("t") or "").lower()
        h = d.get("h") or ""
        if "media.fluke.com" not in h:
            continue
        if not any(k in t for k in KEY):
            continue
        if any(x in t for x in ["safety", "calibration manual", "declaration", "hazardous", "memory"]):
            continue
        sel.append(d)
    saved = []
    for d in sel[:4]:
        h = d["h"]
        if h in downloaded:
            saved.append({"t": d["t"], "path": downloaded[h]})
            continue
        try:
            fn = f"{PREFIX}_{slug.replace('-','_')}_{len(saved)+1}.pdf"
            fp = os.path.join(OD, fn)
            req = urllib.request.Request(h, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read()
            if len(raw) < 15000:
                print(f"  SKIP small {fn} {len(raw)}", flush=True)
                continue
            with open(fp, "wb") as wf:
                wf.write(raw)
            path = f"/uploads/docs/2026/{fn}"
            downloaded[h] = path
            saved.append({"t": d["t"], "path": path})
            total += 1
        except Exception as e:
            print(f"  ERR {slug} {str(e)[:60]}", flush=True)
        time.sleep(0.5)
    if saved:
        mapping[slug] = saved
    print(f"{slug}: {len(saved)} docs", flush=True)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=1)
print("DONE total docs:", total)
