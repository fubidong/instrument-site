# -*- coding: utf-8 -*-
import fitz
pdf_path = "E:/cxy/instrument-site/public/uploads/docs/2026/FLK_fluke_15b_max_1.pdf"
doc = fitz.open(pdf_path)
for i, page in enumerate(doc):
    text = page.get_text()
    if "交流电压" in text and "量程" in text:
        print(f"=== 第 {i+1} 页 ===")
        print(text[:3000])
        print("...")
        break
doc.close()
