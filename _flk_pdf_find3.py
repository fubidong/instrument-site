# -*- coding: utf-8 -*-
import fitz
pdf_path = "E:/cxy/instrument-site/public/uploads/docs/2026/FLK_fluke_15b_max_1.pdf"
doc = fitz.open(pdf_path)
for i, page in enumerate(doc):
    text = page.get_text()
    if "技术规格" in text and "功能" in text:
        print(f"=== 第 {i+1} 页 ===")
        print(text[:5000])
        print("...")
        break
else:
    # 找含"精度"的页面
    for i, page in enumerate(doc):
        text = page.get_text()
        if "基本精度" in text or "精度" in text and "电压" in text:
            print(f"=== 第 {i+1} 页 (含精度) ===")
            print(text[:3000])
            break
doc.close()
