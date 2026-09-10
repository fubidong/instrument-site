# -*- coding: utf-8 -*-
"""福禄克通用 SSR 扫描：JSON-LD 标题/描述/主图 + 特性（urllib）
用法: python _flk_scan_gen.py <分类路径> <输出json> <slug1,slug2,...>
"""
import json, re, sys, time, urllib.request, urllib.parse

CAT = sys.argv[1]          # 如 "电气测试/钳形表"
OUT = sys.argv[2]          # 如 "E:/cxy/flk_clamp_scan.json"
SLUGS = sys.argv[3].split(",")

BASE = "https://www.fluke.com.cn" + urllib.parse.quote("/product/" + CAT + "/")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read().decode("utf-8", "ignore")

out = {}
for i, slug in enumerate(SLUGS):
    url = BASE + slug
    try:
        html = fetch(url)
        m = re.search(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)
        prod = {}
        if m:
            try:
                data = json.loads(m.group(1))
                graph = data.get("@graph", [data]) if isinstance(data, dict) else data
                for g in graph:
                    if isinstance(g, dict) and g.get("@type") == "Product":
                        prod = {
                            "name": g.get("name"),
                            "desc": g.get("description"),
                            "imgs": g.get("image", []),
                        }
                        break
            except Exception as e:
                prod = {"jsonld_error": str(e)}
        tm = re.search(r"<title>(.*?)</title>", html, re.S)
        title = tm.group(1) if tm else ""
        feats = re.findall(r"<li[^>]*>(.*?)</li>", html, re.S)
        feats = [re.sub(r"<[^>]+>", "", f).strip() for f in feats]
        feats = [f for f in feats if 5 <= len(f) <= 80][:12]
        out[slug] = {"title": title, "jsonld": prod, "feats": feats}
        print(f"[{i}/{len(SLUGS)}] {slug} name={str(prod.get('name'))[:40]} imgs={len(prod.get('imgs') or [])} feats={len(feats)}", flush=True)
    except Exception as e:
        print(f"[{i}] {slug} ERR {e}", flush=True)
        out[slug] = {"error": str(e)}
    time.sleep(1.0)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("DONE saved", len(out))
