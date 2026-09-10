# -*- coding: utf-8 -*-
"""批量从中文站采集福禄克产品完整内容 v2 - 修复提取逻辑"""
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

def extract_overview(html):
    """提取产品概述 - 找主要特性/产品概述部分"""
    # 找"主要特性"或"产品概述"
    for kw in ["主要特性", "产品概述", "产品介绍", "概述"]:
        idx = html.find(kw)
        if idx > 0:
            # 往后提取到产品规格
            end = html.find("产品规格", idx)
            if end < 0:
                end = idx + 5000
            section = html[idx:end]
            text = re.sub(r'<[^>]+>', '\n', section)
            text = re.sub(r'\n+', '\n', text).strip()
            text = re.sub(r'^(主要特性|产品概述|产品介绍|概述)[:：]?\s*', '', text)
            if len(text) > 50:
                return text[:3000].strip()
    return ""

def extract_spec_table(html):
    """提取技术规格表格 - 匹配多种关键词"""
    # 找技术规格/技术指标/产品规格
    spec_pos = -1
    for kw in ["技术规格", "技术指标", "产品规格", "规格参数", "Specifications"]:
        pos = html.find(kw)
        if pos > 0:
            spec_pos = pos
            break
    if spec_pos < 0:
        return ""

    # 从关键词前后找表格
    # 先往前找
    table_start = html.rfind("<table", 0, spec_pos)
    if table_start < 0 or spec_pos - table_start > 5000:
        # 往后找
        table_start = html.find("<table", spec_pos)
    if table_start < 0:
        return ""
    table_end = html.find("</table>", table_start)
    if table_end < 0:
        return ""
    table_end += len("</table>")
    table = html[table_start:table_end]

    # 验证表格包含规格相关内容
    if not any(kw in table for kw in ["量程", "分辨率", "精度", "功能", "参数", "范围", "Range"]):
        # 找下一个表格
        next_start = html.find("<table", table_end)
        if next_start > 0:
            next_end = html.find("</table>", next_start)
            if next_end > 0:
                table = html[next_start:next_end+8]

    table = re.sub(r'\s+class="[^"]*"', '', table)
    table = re.sub(r'\s+style="[^"]*"', '', table)
    table = re.sub(r'\s+data-[^=]*="[^"]*"', '', table)
    table = re.sub(r'\s+', ' ', table)
    return table if len(table) > 100 else ""

def extract_datasheet(html):
    links = re.findall(r'href="([^"]*\.pdf[^"]*)"[^>]*>([^<]+)<', html)
    for url, title in links:
        if any(kw in title for kw in ["数据表", "技术参数", "Data Sheet", "Datasheet", "DS"]):
            return url, title.strip()
    return None, None

def process_product(pid, model):
    url = find_cn_url(model)
    if not url:
        return pid, model, "no_url", None, None, None
    html = fetch_page(url)
    if not html or len(html) < 1000:
        return pid, model, "fetch_fail", None, None, None
    overview = extract_overview(html)
    spec_table = extract_spec_table(html)
    ds_url, ds_title = extract_datasheet(html)
    return pid, model, "ok", overview, spec_table, (ds_url, ds_title) if ds_url else None

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

print(f"开始批量采集 v2: {len(db_products)} 个产品...")
results = []
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = {executor.submit(process_product, pid, model): (pid, model) for pid, model in db_products}
    for i, future in enumerate(as_completed(futures)):
        result = future.result()
        results.append(result)
        if (i+1) % 40 == 0:
            print(f"  已处理 {i+1}/{len(db_products)}")

ok = [r for r in results if r[2]=="ok"]
spec = [r for r in ok if r[4]]
overview = [r for r in ok if r[3]]
ds = [r for r in ok if r[5]]
print(f"\n完成: ok={len(ok)}, spec={len(spec)}, overview={len(overview)}, datasheet={len(ds)}")

with open("E:/cxy/_flk_cn_results_v2.json", "w", encoding="utf-8") as f:
    json.dump([{"pid": r[0], "model": r[1], "status": r[2],
                "overview": r[3], "spec": r[4], "datasheet": r[5]} for r in results], f, ensure_ascii=False)
print("已保存 _flk_cn_results_v2.json")
