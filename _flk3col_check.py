# -*- coding: utf-8 -*-
import re
for fn in ["_flk287.html", "_flk289.html"]:
    h = open("E:/cxy/instrument-site/" + fn, encoding="utf-8", errors="ignore").read()
    pn2 = h.count("colspan='3' class='pn2'")
    print(fn, "pn2:", pn2)
    m = re.search(r"<thead><tr><th>功能</th><th>量程/分辨率</th><th>基本精度</th></tr></thead>.{0,260}", h, re.S)
    print("  thead:", bool(m))
    if m:
        print("  ", re.sub("<[^>]+>", "", m.group(0))[:120])
