# -*- coding: utf-8 -*-
"""用 PyMuPDF 提取 Fluke 15B MAX PDF 技术规格表格"""
import fitz  # PyMuPDF

pdf_path = "E:/cxy/instrument-site/public/uploads/docs/2026/FLK_fluke_15b_max_1.pdf"
doc = fitz.open(pdf_path)
print(f"总页数: {len(doc)}")

for i, page in enumerate(doc):
    text = page.get_text()
    if "技术规格" in text or "量程" in text or "分辨率" in text or "Specifications" in text:
        print(f"\n=== 第 {i+1} 页 (含技术规格) ===")
        print(text[:2000])
        print("...")
        break

doc.close()
