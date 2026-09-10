# -*- coding: utf-8 -*-
"""福禄克万用表型号页 SSR 批量采集：提取 JSON-LD 标题/描述/主图（urllib 标准库）"""
import json, re, time, urllib.request, urllib.parse

BASE = "https://www.fluke.com.cn" + urllib.parse.quote("/product/电气测试/数字万用表/")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

SLUGS = [
    "110", "fluke-101", "fluke-106", "fluke-107", "fluke-18b-plus",
    "fluke-15b-max", "fluke-17b-max", "fluke-115", "fluke-116", "fluke-117",
    "fluke-175", "fluke-177", "fluke-179", "fluke-88v", "fluke-28-ii",
    "fluke-28-ii-ex", "fluke-87v", "87v-max", "fluke-287", "fluke-289",
    "fluke-279-fc", "fluke-3000-fc", "283-fc-digital-multimeter",
    "283-fcpv-solar-digital-multimeter", "fluke-15bpromax",
    "fluke-12e-plus", "17b-plus-ind", "fluke-233",
]

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
        print(f"[{i}] {slug} OK name={str(prod.get('name'))[:40]} imgs={len(prod.get('imgs') or [])} feats={len(feats)}")
    except Exception as e:
        print(f"[{i}] {slug} ERR {e}")
        out[slug] = {"error": str(e)}
    time.sleep(1.0)

with open("E:/cxy/flk_dmm_scan.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("DONE saved", len(out))
