# -*- coding: utf-8 -*-
"""福禄克英文站批量采集 v2：改进规格提取（div 配对），用法同 v1"""
import json, re, sys, time, urllib.request

EN = json.load(open("E:/cxy/flk_en_products.json", encoding="utf-8"))
slug2url = {x["slug"]: x["url"] for x in EN}
SLUGS = json.load(open(sys.argv[1], encoding="utf-8"))
OUT = sys.argv[2]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read().decode("utf-8", "ignore")

def extract_tab(html, tab_id):
    """div 配对提取 tab-pane 内容"""
    marker = 'id="' + tab_id + '"'
    i = html.find(marker)
    if i < 0:
        return ""
    # 找包裹的 <div ... id=tab...> 起始
    start = html.find(">", i) + 1
    depth = 0
    j = start
    while j < len(html):
        c = html[j]
        if c == "<":
            if html[j:j+5] == "</div":
                depth -= 1
                if depth < 0:
                    break
            elif html[j:j+4] == "<div":
                depth += 1
            # 跳过标签
            end = html.find(">", j)
            j = end + 1 if end > 0 else j + 1
            continue
        j += 1
    seg = html[start:j]
    txt = re.sub(r"<[^>]+>", " ", seg)
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt[:5000]

def extract(html):
    res = {"overview": "", "spec": "", "models": "", "docs": [], "imgs": []}
    m = re.search(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)
    if m:
        try:
            data = json.loads(m.group(1))
            graph = data.get("@graph", [data]) if isinstance(data, dict) else data
            for g in graph:
                if isinstance(g, dict) and g.get("@type") == "Product":
                    res["imgs"] = [u for u in (g.get("image") or []) if isinstance(u, str) and u.startswith("http")]
                    break
        except Exception:
            pass
    for tab, key in [("overview-tab", "overview"), ("specs-tab", "spec"), ("models-tab", "models")]:
        res[key] = extract_tab(html, tab)
    for m2 in re.finditer(r'<a[^>]+href="(https://media\.fluke\.com/[^"]+)"[^>]*>(.*?)</a>', html, re.S):
        h, t = m2.group(1), re.sub(r"<[^>]+>", "", m2.group(2)).strip()
        res["docs"].append({"t": t[:60], "h": h[:180]})
    seen = set()
    docs = []
    for d in res["docs"]:
        if d["h"] not in seen:
            seen.add(d["h"])
            docs.append(d)
    res["docs"] = docs[:12]
    return res

out = {}
for i, slug in enumerate(SLUGS):
    url = slug2url.get(slug)
    if not url:
        cand = [u for s, u in slug2url.items() if slug.lower() in s.lower() or s.lower() in slug.lower()]
        url = cand[0] if cand else None
    if not url:
        print(f"[{i}] {slug} NO_EN_URL", flush=True)
        out[slug] = {"error": "no_en_url"}
        continue
    try:
        html = fetch(url)
        out[slug] = extract(html)
        print(f"[{i}/{len(SLUGS)}] {slug} ov={len(out[slug]['overview'])} spec={len(out[slug]['spec'])} models={len(out[slug]['models'])} docs={len(out[slug]['docs'])} imgs={len(out[slug]['imgs'])}", flush=True)
    except Exception as e:
        print(f"[{i}] {slug} ERR {str(e)[:70]}", flush=True)
        out[slug] = {"error": str(e)[:70]}
    time.sleep(0.7)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("DONE saved", len(out))
