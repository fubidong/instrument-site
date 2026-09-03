from PIL import Image
import os, glob

def red3(p):
    try:
        img = Image.open(p).convert("RGB")
        img.thumbnail((300, 300))
        px = list(img.getdata())
        n = max(len(px), 1)
        red3 = sum(1 for r, g, b in px if r - g > 80 and r - b > 80 and r > 150)
        return round(red3 / n * 1000, 2)
    except Exception:
        return -1

base = "E:/cxy/instrument-site/public/uploads/product/gallery"
files = glob.glob(base + "/**/img*.jpg", recursive=True)
print("附加图数:", len(files))
suspicious = []
for f in files:
    r = red3(f)
    if r > 20:
        suspicious.append((f, r))
print("疑似广告(red3>20):", len(suspicious))
for f, r in suspicious[:30]:
    print("  ", r, f.replace(base + "/", ""))
