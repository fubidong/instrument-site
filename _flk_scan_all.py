# -*- coding: utf-8 -*-
"""福禄克剩余品类批量 SSR 扫描：读 flk_cats_slugs.json + sitemap URL 映射
用法: python _flk_scan_all.py <品类名> [更多品类...]
输出: E:/cxy/flk_<品类>_scan.json
"""
import json, re, sys, time, urllib.request, urllib.parse

sm = open('E:/cxy/instrument-site/_flk_prod_sm.xml', encoding='utf-8').read()
urls = re.findall(r'<loc>([^<]+)</loc>', sm)
slug2url = {}
for u in urls:
    s = u.rstrip('/').split('/')[-1]
    if s not in slug2url:
        slug2url[s] = u

cats_slugs = json.load(open('E:/cxy/flk_cats_slugs.json', encoding='utf-8'))
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read().decode("utf-8", "ignore")

for cat in sys.argv[1:]:
    slugs = cats_slugs.get(cat, [])
    out = {}
    for i, slug in enumerate(slugs):
        url = slug2url.get(slug)
        if not url:
            out[slug] = {"error": "no_url"}
            print(f"[{i}/{len(slugs)}] {slug} no_url", flush=True)
            continue
        try:
            html = fetch(urllib.parse.quote(url, safe="/:?&=%-."))
            m = re.search(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)
            prod = {}
            if m:
                try:
                    data = json.loads(m.group(1))
                    graph = data.get("@graph", [data]) if isinstance(data, dict) else data
                    for g in graph:
                        if isinstance(g, dict) and g.get("@type") == "Product":
                            prod = {"name": g.get("name"), "desc": g.get("description"),
                                    "imgs": [u for u in (g.get("image") or []) if isinstance(u, str)]}
                            break
                except Exception as e:
                    prod = {"jsonld_error": str(e)}
            tm = re.search(r"<title>(.*?)</title>", html, re.S)
            title = tm.group(1) if tm else ""
            feats = re.findall(r"<li[^>]*>(.*?)</li>", html, re.S)
            feats = [re.sub(r"<[^>]+>", "", f).strip() for f in feats]
            feats = [f for f in feats if 5 <= len(f) <= 80][:12]
            out[slug] = {"title": title, "jsonld": prod, "feats": feats}
            print(f"[{i}/{len(slugs)}] {cat} {slug} name={str(prod.get('name'))[:36]} imgs={len(prod.get('imgs') or [])}", flush=True)
        except Exception as e:
            out[slug] = {"error": str(e)}
            print(f"[{i}] {slug} ERR {str(e)[:50]}", flush=True)
        time.sleep(0.8)
    with open(f'E:/cxy/flk_{cat}_scan.json', "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"== {cat} DONE {len(out)} ==", flush=True)
