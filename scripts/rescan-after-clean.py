from PIL import Image
import os, glob
from pathlib import Path

# 1. 复查所有图，确认无长图
root = "E:/cxy/instrument-site/public"
long = []
total = 0
for ext in ("*.jpg", "*.png"):
    for f in glob.glob(root + "/uploads/product/**/*" + ext, recursive=True):
        try:
            im = Image.open(f)
            w, h = im.size
            total += 1
            if h / w > 1.5:
                long.append(f.replace("\\", "/"))
        except Exception:
            pass
print("扫描图总数:", total)
print("剩余长图:", len(long))
for f in long[:10]:
    print("  ", f)
