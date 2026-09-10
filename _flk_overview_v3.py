# -*- coding: utf-8 -*-
"""重新批量采集福禄克产品概述（正确HTML，含图片），并清理重复技术参数"""
import json, re, os, subprocess, psycopg2, uuid, time
from concurrent.futures import ThreadPoolExecutor, as_completed

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

CAT_MAP = {
    "electrical-testing": "电气测试",
    "digital-multimeters": "数字万用表",
    "clamp-meters": "钳形表",
    "voltage-testers": "电压测试仪",
    "electrical-testers": "电气测试仪",
    "power-quality": "电能质量",
    "thermal-imagers": "热像仪",
    "infrared-thermometers": "红外测温仪",
    "calibration": "校准工具",
    "process-calibration-tools": "过程校准工具",
    "network-testers": "网络测试仪",
    "scopemeter": "示波器",
    "portable-oscilloscopes": "便携式示波器",
    "acoustic-imagers": "声学成像仪",
    "condition-monitoring": "状态监测",
    "temperature": "温度测量",
    "accessories": "附件",
    "test-leads": "测试线",
    "current-clamps": "电流钳",
    "software": "软件",
    "temperature-calibrators": "温度校准器",
    "pressure-calibrators": "压力校准器",
    "electrical-calibrators": "电气校准器",
    "process-calibrators": "过程校准器",
    "digital-thermometer-readouts": "数字测温仪",
    "calibration-baths": "校准槽",
    "rack-mounts-and-hardware": "机架安装",
    "calibration-accessories": "校准附件",
    "pressure": "压力",
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
    if not main:
        return None
    best = None
    for item in en_products:
        url = item.get("url", "")
        slug = url.rstrip("/").split("/")[-1].lower()
        if main == slug or main in slug or slug in main:
            if main == slug:
                parts = url.replace("https://www.fluke.com/en/product/", "").split("/")
                cn_parts = [CAT_MAP.get(p, p) for p in parts]
                return "https://www.fluke.com.cn/product/" + "/".join(cn_parts)
            if not best:
                best = url
    if best:
        parts = best.replace("https://www.fluke.com/en/product/", "").split("/")
        cn_parts = [CAT_MAP.get(p, p) for p in parts]
        return "https://www.fluke.com.cn/product/" + "/".join(cn_parts)
    return None

def fetch_page(url):
    try:
        result = subprocess.run(
            ["curl.exe", "-s", "-L", "--max-time", "25", "-A",
             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", url],
            capture_output=True, text=True, timeout=30, encoding="utf-8", errors="ignore"
        )
        return result.stdout
    except:
        return ""

def extract_overview_html(html):
    """提取产品概述 HTML（包括图片和表格）"""
    # 找 overview_content 或产品概述部分
    patterns = [
        r'<div id="overview_content"[^>]*>(.*?)</div>\s*</div>\s*</div>',
        r'<div id="fluke-product-display-overview"[^>]*>(.*?)</div>\s*</div>',
    ]
    for pat in patterns:
        m = re.search(pat, html, re.DOTALL)
        if m:
            content = m.group(1)
            if len(content) > 100:
                return clean_html(content)

    # 找产品概述文字后的内容
    idx = html.find("产品概述:")
    if idx < 0:
        idx = html.find("产品概述")
    if idx > 0:
        # 往后找 overview_content
        end = html.find("产品规格", idx)
        if end < 0:
            end = idx + 8000
        section = html[idx:end]
        # 提取主要内容
        m = re.search(r'<div id="overview_content"[^>]*>(.*?)</div>', section, re.DOTALL)
        if m:
            return clean_html(m.group(1))
        # 提取段落和表格
        content = ""
        for pm in re.finditer(r'<(p|table|ul|ol|h[1-6])[^>]*>.*?</\1>', section, re.DOTALL):
            content += pm.group(0)
        if content:
            return clean_html(content)
    return ""

def clean_html(html):
    """清理 HTML，保留图片和表格"""
    # 移除 doubao 标记
    html = re.sub(r'\s+data-doubao-translate-traverse-mark="1"', '', html)
    # 移除内联样式（保留结构）
    html = re.sub(r'\s+style="[^"]*"', '', html)
    # 移除 class
    html = re.sub(r'\s+class="[^"]*"', '', html)
    # 移除空标签
    html = re.sub(r'<div[^>]*>\s*</div>', '', html)
    # 压缩空白
    html = re.sub(r'\s+', ' ', html)
    return html.strip()

def process_product(pid, model):
    url = find_cn_url(model)
    if not url:
        return pid, model, None
    html = fetch_page(url)
    if not html or len(html) < 1000:
        return pid, model, None
    overview = extract_overview_html(html)
    return pid, model, overview if overview and len(overview) > 50 else None

# 获取 DB 产品
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    """SELECT id, model FROM "Product" WHERE "brandId"=%s AND "isActive"=true ORDER BY model""",
    (BRAND,),
)
db_products = cur.fetchall()
cur.close()
conn.close()

print(f"开始重新采集产品概述: {len(db_products)} 个...")
results = []
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = {executor.submit(process_product, pid, model): (pid, model) for pid, model in db_products}
    for i, future in enumerate(as_completed(futures)):
        result = future.result()
        results.append(result)
        if (i+1) % 40 == 0:
            print(f"  已处理 {i+1}/{len(db_products)}")

ok = [r for r in results if r[2]]
print(f"\n完成: 成功采集概述={len(ok)}")

with open("E:/cxy/_flk_overview_v3.json", "w", encoding="utf-8") as f:
    json.dump([{"pid": r[0], "model": r[1], "overview": r[2]} for r in results if r[2]], f, ensure_ascii=False)
print("已保存 _flk_overview_v3.json")
