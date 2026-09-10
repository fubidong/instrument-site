# -*- coding: utf-8 -*-
"""用中文站sitemap精确匹配URL，批量采集技术参数"""
import re, subprocess, psycopg2
from concurrent.futures import ThreadPoolExecutor, as_completed

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

# 加载中文站 URL
cn_urls = [l.strip() for l in open("E:/cxy/_flk_cn_urls.txt", encoding="utf-8") if l.strip()]
print(f"中文站URL: {len(cn_urls)}")

def model_to_slug(model):
    """从型号提取 slug 关键词"""
    m = model.upper()
    m = re.sub(r'[\u4e00-\u9fff].*$', '', m).strip()
    m = re.sub(r'^FLUKE[\s\-]*', '', m)
    # 去掉 C 后缀（中国版）
    m = re.sub(r'C$', '', m).strip()
    # 转成 slug 格式
    m = m.lower().replace(' ', '-').replace('+', 'plus')
    return m

def find_cn_url(model):
    """从中文站 URL 列表精确匹配"""
    slug = model_to_slug(model)
    if not slug: return None

    # 精确匹配 slug
    for url in cn_urls:
        url_slug = url.rstrip('/').split('/')[-1].lower()
        if url_slug == slug or url_slug == f"fluke-{slug}":
            return url

    # 包含匹配
    candidates = []
    for url in cn_urls:
        url_slug = url.rstrip('/').split('/')[-1].lower()
        if slug in url_slug or url_slug in slug:
            # 排除 kit 版本
            if 'kit' not in url_slug and 'imsk' not in url_slug:
                candidates.append(url)

    if candidates:
        # 优先最短的 slug（最匹配）
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

def extract_spec_table(html):
    for kw in ["技术规格", "技术指标", "产品规格"]:
        pos = html.find(kw)
        if pos > 0:
            table_start = html.rfind("<table", 0, pos)
            if table_start < 0 or pos - table_start > 5000:
                table_start = html.find("<table", pos)
            if table_start > 0:
                table_end = html.find("</table>", table_start)
                if table_end > 0:
                    table = html[table_start:table_end+8]
                    if any(kw in table for kw in ["量程", "分辨率", "精度", "功能", "参数"]):
                        table = re.sub(r'\s+class="[^"]*"', '', table)
                        table = re.sub(r'\s+style="[^"]*"', '', table)
                        table = re.sub(r'\s+data-[^=]*="[^"]*"', '', table)
                        table = re.sub(r'\s+', ' ', table)
                        if len(table) > 200:
                            return table
    return ""

def process_product(pid, model):
    url = find_cn_url(model)
    if not url: return pid, model, None, None
    html = fetch_page(url)
    if not html or len(html) < 1000: return pid, model, url, None
    spec = extract_spec_table(html)
    return pid, model, url, spec if spec and len(spec) > 200 else None

# 获取用 PDF 规格图的产品
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute("""
    SELECT p.id, p.model FROM "Product" p
    JOIN "ProductTranslation" pt ON pt."productId"=p.id AND pt.locale='zh'
    WHERE p."brandId"=%s AND pt."specsOverview" LIKE '%%spec-pdf-images%%'
    ORDER BY p.model
""", (BRAND,))
products = cur.fetchall()
cur.close()
conn.close()

print(f"采集 {len(products)} 个PDF规格图产品...")
results = []
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = {executor.submit(process_product, pid, model): (pid, model) for pid, model in products}
    for i, future in enumerate(as_completed(futures)):
        results.append(future.result())
        if (i+1) % 10 == 0: print(f"  已处理 {i+1}/{len(products)}")

ok = [r for r in results if r[3]]
no_url = [r for r in results if not r[2]]
print(f"\n成功: {len(ok)}/{len(products)}, 无URL: {len(no_url)}")
for r in no_url[:10]:
    print(f"  无URL: {r[1]}")

# 更新 DB
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
for pid, model, url, spec in ok:
    cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s', (spec, pid, "zh"))
    cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s', (spec, pid, "en"))
conn.commit()
cur.close()
conn.close()
print(f"已更新 {len(ok)} 个产品的技术参数为官网HTML")
