# -*- coding: utf-8 -*-
"""福禄克万用表核心手册下载：用户手册/技术资料/数据表/快速参考"""
import json, os, re, time, urllib.request

with open("E:/cxy/flk_dmm_tabs.json", encoding="utf-8") as f:
    data = json.load(f)

OUT = "E:/cxy/instrument-site/public/uploads/docs/2026"
os.makedirs(OUT, exist_ok=True)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Referer": "https://www.fluke.com.cn/",
}

# 核心文档类型（排除安全须知/内存/校准等次要文档）
KEY_TYPES = ["用户手册", "技术资料", "数据表", "快速参考", "产品资料"]

mapping = {}
downloaded = {}  # url -> path
total = 0
for slug, rec in data.items():
    if rec.get("error") or not rec.get("docs"):
        continue
    selected = []
    for d in rec["docs"]:
        t = d.get("t", "")
        h = d.get("h", "")
        if not h.startswith("http") or "media.fluke.com" not in h:
            continue
        # 判断类型
        is_key = any(kt in t for kt in KEY_TYPES)
        is_secondary = any(kt in t for kt in ["安全须知", "内存易失", "有害物质", "校准手册"])
        if not is_key or is_secondary:
            continue
        selected.append({"t": t, "h": h})
    saved = []
    for d in selected[:4]:  # 每型号最多 4 个核心文档
        h = d["h"]
        if h in downloaded:
            saved.append({"t": d["t"], "path": downloaded[h]})
            continue
        try:
            fn = "FLK_" + slug.replace("-", "_") + "_" + str(len(saved) + 1) + ".pdf"
            fp = os.path.join(OUT, fn)
            req = urllib.request.Request(h, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read()
            if len(raw) < 20000:
                print(f"  SKIP small {fn} {len(raw)}")
                continue
            with open(fp, "wb") as wf:
                wf.write(raw)
            path = f"/uploads/docs/2026/{fn}"
            downloaded[h] = path
            saved.append({"t": d["t"], "path": path})
            total += 1
        except Exception as e:
            print(f"  ERR {slug} {d['t'][:20]} {e}")
        time.sleep(0.6)
    if saved:
        mapping[slug] = saved
    print(f"{slug}: {len(saved)} docs")

with open("E:/cxy/flk_dmm_docs.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=1)
print("DONE total docs:", total)
