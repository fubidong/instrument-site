# -*- coding: utf-8 -*-
import fitz
pdf_path = "E:/cxy/instrument-site/public/uploads/docs/2026/FLK_fluke_15b_max_1.pdf"
doc = fitz.open(pdf_path)
for i in range(19, 24):  # 第20-24页 (0-indexed)
    page = doc[i]
    text = page.get_text()
    print(f"\n========== 第 {i+1} 页 ==========")
    print(text)
doc.close()
