# -*- coding: utf-8 -*-
import re
html = open('_flk_en2.html', encoding='utf-8', errors='ignore').read()
i = html.find('specs-tab-collapse')
if i < 0:
    i = html.find('id="specs-tab"')
if i >= 0:
    seg = html[i:i+1800]
    txt = re.sub(r'<[^>]+>', ' ', seg)
    txt = re.sub(r'\s+', ' ', txt).strip()
    print('SPECS CONTEXT:', txt[:450])
else:
    print('no specs-tab id')
for kw in ['Accuracy', 'Basic Accuracy', 'AC Current', 'AC Voltage', 'Display Count']:
    idx = html.find(kw)
    if idx >= 0:
        print('KW', kw, '=>', re.sub(r'<[^>]+>', ' ', html[idx:idx+150]).replace('\n', ' ')[:140])
