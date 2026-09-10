# -*- coding: utf-8 -*-
"""把中文站采集结果批量更新到 DB"""
import json, psycopg2, uuid, subprocess, os, re

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
DOC_DIR = "E:/cxy/instrument-site/public/uploads/docs/2026"

results = json.load(open("E:/cxy/_flk_cn_results_v2.json", encoding="utf-8"))
ok_results = [r for r in results if r["status"] == "ok"]

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

updated_spec = 0
updated_overview = 0
updated_ds = 0

for r in ok_results:
    pid = r["pid"]
    model = r["model"]

    # 更新技术参数（specsOverview）- 有中文表格才更新
    if r["spec"] and len(r["spec"]) > 200:
        cur.execute(
            'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
            (r["spec"], pid, "zh"),
        )
        cur.execute(
            'UPDATE "ProductTranslation" SET "specsOverview"=%s WHERE "productId"=%s AND locale=%s',
            (r["spec"], pid, "en"),
        )
        updated_spec += 1

    # 更新产品介绍（description）- 有中文概述才更新
    if r["overview"] and len(r["overview"]) > 30:
        cur.execute(
            'UPDATE "ProductTranslation" SET "description"=%s WHERE "productId"=%s AND locale=%s',
            (r["overview"], pid, "zh"),
        )
        updated_overview += 1

    # 数据表
    if r["datasheet"]:
        ds_url, ds_title = r["datasheet"]
        # 检查是否已有 datasheet
        cur.execute(
            """SELECT id FROM "Document" WHERE "productId"=%s AND "docType"='datasheet'""",
            (pid,),
        )
        if not cur.fetchone():
            # 下载 PDF
            safe_name = re.sub(r'[^A-Za-z0-9]+', '_', model)[:30]
            filename = f"FLK_{safe_name}_DS_CN.pdf"
            filepath = os.path.join(DOC_DIR, filename)
            if not os.path.exists(filepath) or os.path.getsize(filepath) < 10000:
                try:
                    subprocess.run(
                        ["curl.exe", "-s", "-L", "--max-time", "30", "-o", filepath, ds_url],
                        timeout=35, capture_output=True
                    )
                except:
                    pass
            if os.path.exists(filepath) and os.path.getsize(filepath) > 10000:
                doc_id = str(uuid.uuid4())
                cur.execute(
                    """INSERT INTO "Document" (id, "productId", title, "filePath", "docType", "createdAt", "updatedAt")
                       VALUES (%s, %s, %s, %s, 'datasheet', NOW(), NOW())""",
                    (doc_id, pid, ds_title, f"/uploads/docs/2026/{filename}"),
                )
                updated_ds += 1

conn.commit()
cur.close()
conn.close()

print(f"更新完成: spec={updated_spec}, overview={updated_overview}, datasheet={updated_ds}")
