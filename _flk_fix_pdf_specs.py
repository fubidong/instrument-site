# -*- coding: utf-8 -*-
"""批量采集用PDF规格图的产品的官网HTML技术参数"""
import json, re, subprocess, psycopg2
from concurrent.futures import ThreadPoolExecutor, as_completed

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

CAT_MAP = {
    "electrical-testing": "电气测试", "digital-multimeters": "数字万用表",
    "clamp-meters": "钳形表", "voltage-testers": "电压测试仪",
    "electrical-testers": "电气测试仪", "power-quality": "电能质量",
    "thermal-imagers": "热像仪", "infrared-thermometers": "红外测温仪",
    "calibration": "校准工具", "process-calibration-tools": "过程校准工具",
    "network-testers": "网络测试仪", "scopemeter": "示波器",
    "portable-oscilloscopes": "便携式示波器", "acoustic-imagers": "声学成像仪",
    "condition-monitoring": "状态监测", "temperature": "温度测量",
    "accessories": "附件", "test-leads": "测试线", "current-clamps": "电流钳",
    "software": "软件", "temperature-calibrators": "温度校准器",
    "pressure-calibrators": "压力校准器", "electrical-calibrators": "电气校准器",
    "process-calibrators": "过程校准器", "digital-thermometer-readouts": "数字测温仪",
    "calibration-baths": "校准槽", "rack-mounts-and-hardware": "机架安装",
    "calibration-accessories": "校准附件", "pressure": "压力",
}

en_products = json.load(open("E:/cxy/flk_en_products.json", encoding="utf-8"))

def model_to_main(model):
    m = model.upper()
    m = re.sub(r'[\u4e00-\u9fff].*$', '', m).strip()
    m = re.sub(r'^FLUKE[\s\-]*', '', m)
    tokens = re.findall(r'[A-Z0-9]+(?:[\+\-\.][A-Z0-9]+)*', m)
    for t in tokens:
        if re.search(r'\d', t):
            return t.rstrip("+").lower()
    return None

def find_cn_url(model):
    main = model_to_main(model)
    if not main: return None
    best = None
    for item in en_products:
        url = item.get("url", "")
        slug = url.rstrip("/").split("/")[-1].lower()
        if main == slug or main in slug or slug in main:
            if main == slug:
                parts = url.replace("https://www.fluke.com/en/product/", "").split("/")
                return "https://www.fluke.com.cn/product/" + "/".join([CAT_MAP.get(p, p) for p in parts])
            if not best: best = url
    if best:
        parts = best.replace("https://www.fluke.com/en/product/", "").split("/")
        return "https://www.fluke.com.cn/product/" + "/".join([CAT_MAP.get(p, p) for p in parts])
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
    if not url: return pid, model, None
    html = fetch_page(url)
    if not html or len(html) < 1000: return pid, model, None
    spec = extract_spec_table(html)
    return pid, model, spec if spec and len(spec) > 200 else None

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

print(f"采集 {len(products)} 个PDF规格图产品的官网HTML...")
results = []
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = {executor.submit(process_product, pid, model): (pid, model) for pid, model in products}
    for i, future in enumerate(as_completed(futures)):
        results.append(future.result())
        if (i+1) % 10 == 0: print(f"  已处理 {i+1}/{len(products)}")

ok = [r for r in results if r[2]]
print(f"\n成功: {len(ok)}/{len(products)}")

# 更新 DB
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
for pid, model, spec in ok:
    cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s', (spec, pid, "zh"))
    cur.execute('UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s', (spec, pid, "en"))
conn.commit()
cur.close()
conn.close()
print(f"已更新 {len(ok)} 个产品的技术参数为官网HTML")
