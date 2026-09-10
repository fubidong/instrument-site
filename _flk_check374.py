# -*- coding: utf-8 -*-
import re
html = open('_flk374.html', encoding='utf-8', errors='ignore').read()
i = html.find('id="specs-tab"')
print('specs-tab idx:', i)
if i >= 0:
    seg = html[i:i+3000]
    txt = re.sub(r'<[^>]+>', '|', seg)
    txt = re.sub(r'\|+', '|', txt)
    print('RAW around specs-tab:', txt[:800])
# 找 tab-pane 结构
m = re.search(r'<div[^>]*class="[^"]*tab-pane[^"]*"[^>]*id="specs-tab"[^>]*>(.*?)</div>', html, re.S)
if m:
    print('TAB-PANE len:', len(m.group(1)))
    t = re.sub(r'<[^>]+>', ' ', m.group(1))
    t = re.sub(r'\s+', ' ', t).strip()
    print('TAB-PANE text:', t[:500])
