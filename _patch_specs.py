# -*- coding: utf-8 -*-
p = r"E:/cxy/instrument-site/src/app/admin/(protected)/products/actions.ts"
s = open(p, encoding="utf-8").read()
old = 'const selectionEn = cleanHtml(formData.get("selection_en") as string);'
new = (
    old
    + '\n  const specsZh = cleanHtml(formData.get("specsOverview_zh") as string);'
    + '\n  const specsEn = cleanHtml(formData.get("specsOverview_en") as string);'
)
print("count:", s.count(old))
s = s.replace(old, new, 1)
open(p, "w", encoding="utf-8", newline="").write(s)
print("done")
