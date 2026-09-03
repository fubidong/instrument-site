from PIL import Image
import os

paths = [
    "E:/cxy/instrument-site/public/uploads/product/2026/sdl1020x.jpg",
    "E:/cxy/instrument-site/public/uploads/product/gallery/sdl1020x/img1.jpg",
    "E:/cxy/instrument-site/public/uploads/product/gallery/sdl1020x/img2.jpg",
    "E:/cxy/instrument-site/public/uploads/product/gallery/sdl1020x/img3.jpg",
    "E:/cxy/instrument-site/public/uploads/product/gallery/sdl1020x/img4.jpg",
    "E:/cxy/instrument-site/public/uploads/product/gallery/sdl1020x/img5.jpg",
    "E:/cxy/instrument-site/public/uploads/product/gallery/sdl1020x/img6.jpg",
]
for p in paths:
    if not os.path.exists(p):
        print(os.path.basename(p), "MISSING")
        continue
    im = Image.open(p)
    w, h = im.size
    ratio = h / w if w > 0 else 0
    flag = ""
    if ratio > 1.5:
        flag = "  <-- 竖长图"
    elif ratio < 0.67:
        flag = "  <-- 横长图"
    print(os.path.basename(p), f"{w}x{h}", f"h/w={ratio:.2f}", flag)
