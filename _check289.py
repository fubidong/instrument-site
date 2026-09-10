# -*- coding: utf-8 -*-
import re
h = open("E:/cxy/instrument-site/_p289.html", encoding="utf-8", errors="ignore").read()
print("len:", len(h))
tables = re.findall(r"<table class=['\"]([^'\"]*)['\"]", h)
print("tables:", tables[:5])
for kw in ["spec-3col", "量程", "分辨率", "基本精度", "直流电压", "技术参数", "spec-table"]:
    print(kw, h.count(kw))
