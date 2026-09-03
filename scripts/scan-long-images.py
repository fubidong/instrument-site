from PIL import Image
import os, glob, json

# 扫描所有产品图（cover + gallery），找出长图
cover_dir = "E:/cxy/instrument-site/public/uploads/product/2026"
gallery_dir = "E:/cxy/instrument-site/public/uploads/product/gallery"

results = []

# cover 图
for f in glob.glob(cover_dir + "/*.jpg") + glob.glob(cover_dir + "/*.png"):
    try:
        im = Image.open(f)
        w, h = im.size
        ratio = h / w
        if ratio > 1.5 or ratio < 0.67:
            results.append({"file": f.replace("E:/cxy/instrument-site/public", ""), "w": w, "h": h, "ratio": round(ratio, 2), "type": "cover"})
    except Exception:
        pass

# gallery 图
for f in glob.glob(gallery_dir + "/**/*.jpg", recursive=True) + glob.glob(gallery_dir + "/**/*.png", recursive=True):
    try:
        im = Image.open(f)
        w, h = im.size
        ratio = h / w
        if ratio > 1.5 or ratio < 0.67:
            results.append({"file": f.replace("E:/cxy/instrument-site/public", ""), "w": w, "h": h, "ratio": round(ratio, 2), "type": "gallery"})
    except Exception:
        pass

print("长图总数:", len(results))
for r in results:
    print("  ", r["type"], r["ratio"], f"{r['w']}x{r['h']}", r["file"])

json.dump(results, open("C:/cxy/long-images.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("已保存 C:/cxy/long-images.json")
