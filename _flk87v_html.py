# -*- coding: utf-8 -*-
import re
h = open("E:/cxy/_flk87v.html", encoding="utf-8", errors="ignore").read()
print("len:", len(h))
m = re.search(r'id=["\']specs-tab["\']', h)
print("specs-tab found:", m is not None)
if m:
    start = m.start()
    print(h[start:start+3000])
else:
    # 找 table
    tables = re.findall(r'<table[^>]*>', h)
    print("tables:", len(tables))
    for t in tables[:5]:
        print(" ", t[:100])
