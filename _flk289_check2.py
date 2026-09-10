# -*- coding: utf-8 -*-
"""验证 Fluke 289 前台三列渲染"""
import re
h = open("E:/cxy/instrument-site/_flk289.html", encoding="utf-8", errors="ignore").read()
print("spec-3col count:", h.count("spec-3col"))
th = "<thead><tr><th>功能</th><th>量程/分辨率</th><th>基本精度</th></tr></thead>"
print("thead count:", h.count(th))
m = re.search(re.escape(th) + r".{0,400}", h, re.S)
print((m.group(0) if m else "NO THEAD")[:400])
