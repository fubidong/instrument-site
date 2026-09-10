# -*- coding: utf-8 -*-
"""宽松匹配：用型号核心关键词匹配中文站URL，批量采集概述"""
import re, subprocess, psycopg2
from concurrent.futures import ThreadPoolExecutor, as_completed

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
cn_urls = [l.strip() for l in open("E:/cxy/_flk_cn_urls.txt", encoding="utf-8") if l.strip()]

def extract_keywords(model):
    """从型号提取核心关键词列表（宽松匹配用）"""
    m = model.upper()
    # 去掉中文描述
    m = re.sub(r'[\u4e00-\u9fff].*$', '', m).strip()
    # 去掉 Fluke 前缀
    m = re.sub(r'^FLUKE[\s\-]*', '', m)
    # 去掉特殊字符
    m = m.replace('®', '').replace('™', '').replace('"', '').replace("'", '')
    # 按 / , 和 空格分割，取每个部分的核心型号
    parts = re.split(r'[/,\s]+', m)
    keywords = []
    for p in parts:
        p = p.strip()
        # 只保留含数字的部分（型号）
        if re.search(r'\d', p) and len(p) >= 2:
            # 去掉末尾的 C（中国版）、KIT 等
            p_clean = re.sub(r'[CK]IT$', '', p)
            p_clean = re.sub(r'C$', '', p_clean)
            if p_clean:
                keywords.append(p_clean.lower())
    # 去重，保留顺序
    seen = set()
    result = []
    for k in keywords:
        if k not in seen:
            seen.add(k)
            result.append(k)
    return result

def find_cn_url_loose(model):
    """宽松匹配：用关键词在URL中搜索"""
    keywords = extract_keywords(model)
    if not keywords:
        return None, "无关键词"

    # 尝试每个关键词
    for kw in keywords:
        # 精确匹配 slug
        for url in cn_urls:
            slug = url.rstrip('/').split('/')[-1].lower()
            if slug == kw or slug == f"fluke-{kw}":
                return url, f"精确匹配:{kw}"

        # 包含匹配（排除 kit）
        candidates = []
        for url in cn_urls:
            slug = url.rstrip('/').split('/')[-1].lower()
            if kw in slug and 'kit' not in slug and 'imsk' not in slug:
                candidates.append(url)
        if candidates:
            # 优先 slug 最短的
            candidates.sort(key=lambda u: len(u.rstrip('/').split('/')[-1]))
            return candidates[0], f"包含匹配:{kw}->{candidates[0].split('/')[-1]}"

    # 最后尝试：用第一个关键词的数字部分
    if keywords:
        first_kw = keywords[0]
        # 提取纯数字部分
        num_match = re.search(r'\d+', first_kw)
        if num_match:
            num = num_match.group()
            for url in cn_urls:
                slug = url.rstrip('/').split('/')[-1].lower()
                if num in slug and 'kit' not in slug:
                    return url, f"数字匹配:{num}->{slug}"

    return None, f"关键词:{keywords} 未匹配"

def fetch_page(url):
    try:
        r = subprocess.run(["curl.exe", "-s", "-L", "--max-time", "25", "-A",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", url],
            capture_output=True, text=True, timeout=30, encoding="utf-8", errors="ignore")
        return r.stdout
    except: return ""

def extract_overview(html):
    """提取产品概述"""
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

    # 方式3: meta description
    m = re.search(r'<meta[^>]+name="description"[^>]+content="([^"]+)"', html)
    if m:
        desc = m.group(1).strip()
        if len(desc) > 30 and '福禄克官方商城' not in desc:
            return f"<p>{desc}</p>"

    return ""

def process_product(pid, model):
    url, match_info = find_cn_url_loose(model)
    if not url:
        return pid, model, None, match_info
    html = fetch_page(url)
    if not html or len(html) < 1000:
        return pid, model, None, f"{match_info} 页面获取失败"
    overview = extract_overview(html)
    if overview and len(overview) > 50:
        return pid, model, overview, match_info
    return pid, model, None, f"{match_info} 提取失败"

# 获取剩余产品
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

print(f"剩余 {len(products)} 个产品，开始宽松匹配采集...\n")
results = []
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = {executor.submit(process_product, pid, model): (pid, model) for pid, model in products}
    for i, future in enumerate(as_completed(futures)):
        results.append(future.result())
        if (i+1) % 10 == 0: print(f"  已处理 {i+1}/{len(products)}")

ok = [r for r in results if r[2]]
failed = [r for r in results if not r[2]]
print(f"\n成功: {len(ok)}/{len(products)}, 失败: {len(failed)}")

print("\n--- 成功的产品 ---")
for pid, model, overview, info in ok:
    print(f"  ✓ {model} [{info}]")

print("\n--- 失败的产品（需人工确认）---")
for pid, model, _, info in failed:
    print(f"  ✗ {model} [{info}]")

# 更新 DB
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
for pid, model, overview, info in ok:
    cur.execute('UPDATE "ProductTranslation" SET description=%s WHERE "productId"=%s AND locale=%s', (overview, pid, "zh"))
    cur.execute('UPDATE "ProductTranslation" SET description=%s WHERE "productId"=%s AND locale=%s', (overview, pid, "en"))
conn.commit()
cur.close()
conn.close()
print(f"\n已更新 {len(ok)} 个产品的概述")
