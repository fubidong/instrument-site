# -*- coding: utf-8 -*-
"""补抓 11 个无文档产品的英文站手册 PDF 并入库"""
import re, json, os, sys, time, urllib.request, uuid, psycopg2

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
DOC_DIR = "E:/cxy/instrument-site/public/uploads/docs/2026"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
REF = "https://www.fluke.com/en/"

targets = {
    "5430": "https://www.fluke.com/en/product/calibration-tools/temperature-calibration/its-90-temperature-standards/5430",
    "5725a": "https://www.fluke.com/en/product/calibration-tools/electrical-calibration/electrical-calibrators/5725a",
    "fluke-1535-1537": "https://www.fluke.com/en/product/electrical-testing/insulation-testers/fluke-1535-1537",
    "fluke-2ac": "https://www.fluke.com/en/product/electrical-testing/basic-testers/fluke-2ac",
    "fluke-301d": "https://www.fluke.com/en/product/electrical-testing/clamp-meters/fluke-301d",
    "fluke-700prv-1": "https://www.fluke.com/en/product/calibration-tools/pressure-calibrators/fluke-700prv-1",
    "fluke-771": "https://www.fluke.com/en/product/calibration-tools/ma-loop-calibrators/fluke-771",
    "fluke-calibration-p3031-p3032": "https://www.fluke.com/en/product/calibration-tools/pressure-calibrators/fluke-calibration-p3031-p3032",
    "fluke-co-205": "https://www.fluke.com/en/product/building-infrastructure/indoor-air-quality-testing/fluke-co-205",
    "fluke-t5-1000": "https://www.fluke.com/en/product/electrical-testing/basic-testers/fluke-t5-1000",
    "fluke-tc03": "https://www.fluke.com/en/product/thermal-cameras/fluke-tc03",
}

def fetch(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def find_product(cur, slug):
    key = re.sub(r"[^a-z0-9]+", "", slug.lower())
    cur.execute(
        '''SELECT p.id, p.model FROM "Product" p WHERE p."brandId"=%s AND p."isActive"=true''',
        (BRAND,),
    )
    for pid, model in cur.fetchall():
        m = re.sub(r"[^a-z0-9]+", "", (model or "").lower())
        if key and key in m:
            return pid, model
    return None, None

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

for slug, url in targets.items():
    pid, model = find_product(cur, slug)
    print(f"== {slug} -> product={model}")
    if not pid:
        print("   no product match, skip")
        continue
    try:
        html = fetch(url).decode("utf-8", "ignore")
    except Exception as e:
        print("   fetch fail:", e)
        continue
    # 提取 media.fluke.com PDF
    pdfs = re.findall(r"https://media\.fluke\.com/[^\"'<>\\ ]+?_original%20file\.pdf", html)
    if not pdfs:
        pdfs = re.findall(r"https://media\.fluke\.com/[^\"'<>\\ ]+?file\.pdf", html)
    pdfs = list(dict.fromkeys(pdfs))
    print("   pdfs:", len(pdfs))
    idx = 0
    for p in pdfs[:6]:
        # 提取标题上下文
        m = re.search(r'<a[^>]*href="' + re.escape(p) + r'"[^>]*>(.*?)</a>', html, re.S)
        title = re.sub(r"<[^>]+>", " ", m.group(1)).strip() if m else os.path.basename(p)
        title = re.sub(r"\s+", " ", title).strip()
        if not title or len(title) > 80:
            title = model + " " + (os.path.basename(p).split("_")[0] if "_" in os.path.basename(p) else "手册")
        t = title.lower()
        # 过滤非产品手册（宣传册/记忆波动/内部文档）
        if any(k in t for k in ("brochure", "presscal", "statement of memory", "solar", "warranty", "register")):
            print(f"   skip non-manual: {title}")
            continue
        # 分类
        if any(k in t for k in ("datasheet", "data sheet", "spec", "specification")):
            dtype = "datasheet"
        elif any(k in t for k in ("quick", "getting started", "start here")):
            dtype = "quick_guide"
        elif any(k in t for k in ("user", "manual", "users", "instruction", "calibration")):
            dtype = "user_manual"
        else:
            dtype = "user_manual"
        # 下载（文件名加序号避免覆盖）
        idx += 1
        fname = f"FLK_{slug.replace('-', '_')}_{idx}_{dtype}.pdf"
        fpath = os.path.join(DOC_DIR, fname)
        try:
            data = fetch(p, {"User-Agent": UA, "Referer": REF})
            if len(data) < 10000:
                print(f"   {fname} too small ({len(data)}), skip")
                continue
            with open(fpath, "wb") as f:
                f.write(data)
            rel = f"/uploads/docs/2026/{fname}"
            # 清理该产品同 slug 前缀旧记录（避免重复）
            cur.execute('DELETE FROM "Document" WHERE "productId"=%s AND "filePath" LIKE %s',
                        (pid, f"%FLK_{slug.replace('-', '_')}%"))
            cur.execute(
                '''INSERT INTO "Document" (id, "createdAt", "updatedAt", title, "docType", "filePath", "productId")
                   VALUES (%s, now(), now(), %s, %s, %s, %s) ON CONFLICT DO NOTHING''',
                (str(uuid.uuid4()), title, dtype, rel, pid),
            )
            print(f"   saved {fname} [{dtype}] {len(data)}B  title={title}")
        except Exception as e:
            print("   dl fail:", e)
    time.sleep(1)

conn.commit()
print("DONE")
cur.close()
conn.close()
