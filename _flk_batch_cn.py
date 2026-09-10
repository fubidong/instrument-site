# -*- coding: utf-8 -*-
"""批量从中文站采集福禄克产品完整内容"""
import json, re, os, subprocess, psycopg2, uuid, time

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"

# 英文分类到中文分类的映射
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
}

# 加载英文站产品映射
en_products = json.load(open("E:/cxy/flk_en_products.json", encoding="utf-8"))
print(f"英文站产品: {len(en_products)}")

# 获取 DB 中所有福禄克产品
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute(
    """SELECT id, model FROM "Product" WHERE "brandId"=%s AND "isActive"=true ORDER BY model""",
    (BRAND,),
)
db_products = cur.fetchall()
print(f"DB 产品: {len(db_products)}")

def model_to_slug(model):
    """从产品型号提取 slug 关键词"""
    m = model.upper()
    m = re.sub(r'[\u4e00-\u9fff].*$', '', m).strip()
    m = re.sub(r'^FLUKE[\s\-]*', '', m)
    tokens = re.findall(r'[A-Z0-9]+(?:[\+\-\.][A-Z0-9]+)*', m)
    main = None
    for t in tokens:
        if re.search(r'\d', t):
            main = t.rstrip("+").lower()
            break
    return main

def find_cn_url(model):
    """从英文站映射找中文站 URL"""
    main = model_to_slug(model)
    if not main:
        return None
    for item in en_products:
        url = item.get("url", "")
        slug = url.rstrip("/").split("/")[-1].lower()
        if main in slug or slug in main:
            # 构造中文 URL
            parts = url.replace("https://www.fluke.com/en/product/", "").split("/")
            cn_parts = [CAT_MAP.get(p, p) for p in parts]
            return "https://www.fluke.com.cn/product/" + "/".join(cn_parts)
    return None

# 测试匹配
test_count = 0
for pid, model in db_products[:10]:
    url = find_cn_url(model)
    print(f"  {model} -> {url}")
    if url: test_count += 1
print(f"测试匹配: {test_count}/10")

cur.close()
conn.close()
