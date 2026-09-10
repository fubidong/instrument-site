# -*- coding: utf-8 -*-
"""分析福禄克前台首页渲染"""
import re, json

h = open("E:/cxy/instrument-site/_flk_home.html", encoding="utf-8", errors="ignore").read()
print("length:", len(h))
cats = sorted(set(re.findall(r"/fluke/category/([a-z0-9-]+)", h)))
print("categories:", cats)
prods = sorted(set(re.findall(r"/zh/products/([^\"\\< >]+)", h)))
print("sample products:", prods[:8])
m = re.search(r"<title>([^<]*)</title>", h)
print("title:", m.group(1) if m else None)
