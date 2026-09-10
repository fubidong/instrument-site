# -*- coding: utf-8 -*-
"""改进提取逻辑，重新采集可匹配URL的产品概述"""
import re, subprocess, psycopg2
from concurrent.futures import ThreadPoolExecutor, as_completed

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
cn_urls = [l.strip() for l in open("E:/cxy/_flk_cn_urls.txt", encoding="utf-8") if l.strip()]

def model_to_slug(model):
    m = model.upper()
    m = re.sub(r'[\u4e00-\u9fff].*$', '', m).strip()
    m = re.sub(r'^FLUKE[\s\-]*', '', m)
    m = re.sub(r'C$', '', m).strip()
    m = m.lower().replace(' ', '-').replace('+', 'plus')
    return m

def find_cn_url(model):
    slug = model_to_slug(model)
    if not slug: return None
    for url in cn_urls:
        url_slug = url.rstrip('/').split('/')[-1].lower()
        if url_slug == slug or url_slug == f"fluke-{slug}":
            return url
    candidates = []
    for url in cn_urls:
        url_slug = url.rstrip('/').split('/')[-1].lower()
        if slug in url_slug or url_slug in slug:
            if 'kit' not in url_slug and 'imsk' not in url_slug:
                candidates.append(url)
    if candidates:
        candidates.sort(key=lambda u: len(u.rstrip('/').split('/')[-1]))
        return candidates[0]
    return None

def fetch_page(url):
    try:
        r = subprocess.run(["curl.exe", "-s", "-L", "--max-time", "25", "-A",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", url],
            capture_output=True, text=True, timeout=30, encoding="utf-8", errors="ignore")
        return r.stdout
    except: return ""

def extract_overview(html):
    """改进的概述提取：多种方式尝试"""
    # 方式1: overview_content div
    m = re.search(r'id="overview_content"[^>]*>(.*?)</div>\s*</div>\s*</div>', html, re.DOTALL)
    if m:
        content = m.group(1)
        content = re.sub(r'\s+data-[^=]*="[^"]*"', '', content)
        content = re.sub(r'\s+class="[^"]*"', '', content)
        content = re.sub(r'\s+style="[^"]*"', '', content)
        content = re.sub(r'\s+', ' ', content)
        if len(content) > 50 and '福禄克官方商城' not in content:
            return content.strip()

    # 方式2: 产品概述 section
    m = re.search(r'产品概述[^<]*</h2>(.*?)</section>', html, re.DOTALL)
    if m:
        content = m.group(1)
        content = re.sub(r'<[^>]+>', ' ', content)
        content = re.sub(r'\s+', ' ', content).strip()
        if len(content) > 50 and '福禄克官方商城' not in content:
            return f"<p>{content}</p>"

    # 方式3: 找 main 内容区的第一个有意义的段落
    m = re.search(r'<main[^>]*>(.*?)</main>', html, re.DOTALL)
    if m:
        main_html = m.group(1)
        # 提取所有 p 标签
        ps = re.findall(r'<p[^>]*>(.*?)</p>', main_html, re.DOTALL)
        content = ''
        for p in ps:
            p_text = re.sub(r'<[^>]+>', '', p).strip()
            if len(p_text) > 30 and '福禄克官方商城' not in p_text and '导航' not in p_text:
                content += f"<p>{p_text}</p>"
        if len(content) > 50:
            return content

    # 方式4: 找 meta description
    m = re.search(r'<meta[^>]+name="description"[^>]+content="([^"]+)"', html)
    if m:
        desc = m.group(1).strip()
        if len(desc) > 30:
            return f"<p>{desc}</p>"

    return ""

def process_product(pid, model):
    url = find_cn_url(model)
    if not url: return pid, model, None
    html = fetch_page(url)
    if not html or len(html) < 1000: return pid, model, None
    overview = extract_overview(html)
    return pid, model, overview if overview and len(overview) > 50 else None

# 获取产品介绍仍为导航文字的产品
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute("""
    SELECT p.id, p.model FROM "Product" p
    JOIN "ProductTranslation" pt ON pt."productId"=p.id AND pt.locale='zh'
    WHERE p."brandId"=%s
    AND (pt.description LIKE '%%福禄克官方商城%%' OR pt.description LIKE '%%产品样本下载%%'
         OR pt.description LIKE '%%尊享服务%%' OR pt.description LIKE '%%Fluke 新产品%%'
         OR pt.description LIKE '%%测试导线%%' OR pt.description LIKE '%%基础设施建设%%'
         OR pt.description LIKE '%%event-nav%%')
    ORDER BY p.model
""", (BRAND,))
products = cur.fetchall()
cur.close()
conn.close()

# 只处理可以匹配到 URL 的产品
to_process = []
for pid, model in products:
    url = find_cn_url(model)
    if url:
        to_process.append((pid, model, url))

print(f"可匹配URL的产品: {len(to_process)}/{len(products)}")
results = []
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = {executor.submit(process_product, pid, model): (pid, model) for pid, model, url in to_process}
    for i, future in enumerate(as_completed(futures)):
        results.append(future.result())
        if (i+1) % 10 == 0: print(f"  已处理 {i+1}/{len(to_process)}")

ok = [r for r in results if r[2]]
print(f"\n成功: {len(ok)}/{len(to_process)}")
for r in ok:
    print(f"  ✓ {r[1]}")

# 更新 DB
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
for pid, model, overview in ok:
    cur.execute('UPDATE "ProductTranslation" SET description=%s WHERE "productId"=%s AND locale=%s', (overview, pid, "zh"))
    cur.execute('UPDATE "ProductTranslation" SET description=%s WHERE "productId"=%s AND locale=%s', (overview, pid, "en"))
conn.commit()
cur.close()
conn.close()
print(f"已更新 {len(ok)} 个产品的概述")
