# -*- coding: utf-8 -*-
"""查 11 个可匹配 slug 的英文站 URL"""
import json
en = json.load(open("E:/cxy/flk_en_products.json", encoding="utf-8"))
slugs = ["5430", "5725a", "fluke-1535-1537", "fluke-2ac", "fluke-301d",
         "fluke-700prv-1", "fluke-771", "fluke-calibration-p3031-p3032",
         "fluke-co-205", "fluke-t5-1000", "fluke-tc03"]
for x in en:
    if x.get("slug") in slugs:
        print(x["slug"], "|", x.get("url"))
