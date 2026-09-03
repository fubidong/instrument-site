from PIL import Image
import os

def red_ratio(p):
    img = Image.open(p).convert("RGB")
    img.thumbnail((300, 300))
    px = list(img.getdata())
    n = len(px)
    # 饱和红
    red = sum(1 for r, g, b in px if r > 140 and g < 100 and b < 100)
    # 亮红（促销文字常为亮红/橙红）
    red2 = sum(1 for r, g, b in px if r > 200 and g < 80 and b < 80)
    # 整体红色调（r明显大于g和b）
    red3 = sum(1 for r, g, b in px if r - g > 80 and r - b > 80 and r > 150)
    return round(red / n * 1000, 2), round(red2 / n * 1000, 2), round(red3 / n * 1000, 2)

for p in ["C:/cxy/p1.jpg", "C:/cxy/p2.jpg", "C:/cxy/v2.jpg", "C:/cxy/verify-SDG1062X.jpg", "C:/cxy/verify-SPD3303X.jpg"]:
    if os.path.exists(p):
        print(os.path.basename(p), "red:", red_ratio(p))
