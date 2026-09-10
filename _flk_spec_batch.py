# -*- coding: utf-8 -*-
"""批量修复福禄克产品 specsOverview/selection：紧凑文本 -> HTML 表格（存回 DB）
用法: python _flk_spec_batch.py [--dry]
"""
import json, re, sys, psycopg2
sys.path.insert(0, "E:/cxy/instrument-site")
from _flk_spec_fix import parse_en_spec, parse_cn_spec, parse_en_models, parse_cn_models

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
DRY = "--dry" in sys.argv
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

# 确认列名
cur.execute('SELECT column_name FROM information_schema.columns WHERE table_name=%s ORDER BY ordinal_position', ("ProductTranslation",))
cols = [r[0] for r in cur.fetchall()]
print("ProductTranslation cols:", cols)

cur.execute('''
  SELECT pt.id, pt."locale", pt."specsOverview", pt."selection", p.model
  FROM "ProductTranslation" pt JOIN "Product" p ON p.id = pt."productId"
  WHERE p."brandId" = %s
''', (BRAND,))
rows = cur.fetchall()
print("translations:", len(rows))

spec_fixed = 0
sel_fixed = 0
examples = []
for ptid, loc, spec, sel, model in rows:
    new_spec = None
    new_sel = None
    # spec: 非 HTML 才解析
    if spec and not spec.lstrip().startswith("<"):
        is_cn = any(k in spec for k in ("量程", "分辨力", "分辨率", "精度", "交流电压", "直流电压",
                                        "产品规格", "技术规格", "技术指标", "电阻", "电容", "频率"))
        if is_cn:
            new_spec = parse_cn_spec(spec)
        elif re.search(r"Range|Resolution|Accuracy", spec, re.I):
            new_spec = parse_en_spec(spec)
        if new_spec and len(new_spec) > 30:
            spec_fixed += 1
        elif spec and spec.lstrip().startswith("Specifications:"):
            # fallback：无参数表结构的英文短 spec → 去前缀保留整洁文本
            cleaned = re.sub(r"^Specifications:\s*", "", spec).strip()
            if cleaned:
                new_spec = cleaned
                spec_fixed += 1
        else:
            new_spec = None
    # selection: 表格 → 仅清理内部残留标签；纯文本/旧列表 → strip 后重解析
    needs_sel = False
    cleaned_sel = None
    if sel and "selection-table" in sel:
        # 清理 td 内残留的列表/段落闭合标签（含转义形式 &lt;/li&gt;）
        cleaned_sel = re.sub(r"</?(?:li|ul|div|p|br|span|b|i|strong|em)[^>]*>", "", sel)
        cleaned_sel = re.sub(r"&lt;/?(?:li|ul|div|p|br|span|b|i|strong|em)[^&]*&gt;", "", cleaned_sel)
        if cleaned_sel != sel:
            new_sel = cleaned_sel
            sel_fixed += 1
    elif sel and ("model-list" in sel or "</" in sel):
        needs_sel = True   # 旧列表/HTML残留 → strip 后重解析
    elif sel and not sel.lstrip().startswith("<"):
        needs_sel = True   # 纯文本
    if needs_sel:
        raw = re.sub(r"<[^>]+>", " ", sel).strip()
        is_cn = "型号" in raw or "包括" in raw or "包含" in raw or "Fluke 1" in raw
        new_sel = parse_cn_models(raw) if is_cn else parse_en_models(raw)
        if new_sel and len(new_sel) > 10:
            sel_fixed += 1
        else:
            new_sel = None
    if new_spec or new_sel:
        if len(examples) < 3:
            examples.append({"model": model, "loc": loc, "spec": bool(new_spec), "sel": bool(new_sel)})
        if not DRY:
            fields = []
            params = []
            if new_spec:
                fields.append('"specsOverview"=%s'); params.append(new_spec)
            if new_sel:
                fields.append('"selection"=%s'); params.append(new_sel)
            params.append(ptid)
            cur.execute(f'UPDATE "ProductTranslation" SET {", ".join(fields)} WHERE id=%s', params)
if not DRY:
    conn.commit()
print("spec fixed:", spec_fixed, "| selection fixed:", sel_fixed)
for e in examples:
    print("  ex:", e)
cur.close(); conn.close()
print("DONE")
