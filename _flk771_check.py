# -*- coding: utf-8 -*-
import re
h = open("E:/cxy/instrument-site/_flk771.html", encoding="utf-8", errors="ignore").read()
for m in re.finditer(r"/uploads/docs/[^\s\"']+", h):
    print(m.group(0))
print("---")
# 找资料下载附近内容
i = h.find("资料下载")
print(h[i-200:i+400] if i >= 0 else "no tab label")
