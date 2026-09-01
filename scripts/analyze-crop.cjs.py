# 分析促销图底部促销区边界并测试裁剪
from PIL import Image
import os

def is_redish(px):
    r, g, b = px
    return r > 150 and r > g * 1.5 and r > b * 1.5

def analyze(path, crop_ratio=0.72):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    # 从底部向上扫描每行红色像素占比
    rows = []
    for y in range(h - 1, -1, -1):
        red_count = 0
        step = max(1, w // 60)
        for x in range(0, w, step):
            if is_redish(px[x, y]):
                red_count += 1
        rows.append((y, red_count))
    # 找促销区顶边：从底部开始连续红色行的最上
    threshold = max(1, (w // step) * 0.3)
    promo_top = None
    in_promo = False
    for y, rc in rows:
        if rc > threshold:
            in_promo = True
            promo_top = y
        else:
            if in_promo:
                break
    print(f"{os.path.basename(path)}: {w}x{h} 促销区顶边y={promo_top} ({promo_top/h*100:.0f}%)")
    if promo_top:
        crop_h = promo_top
        cropped = im.crop((0, 0, w, crop_h))
        out = path.replace(".jpg", "-crop.jpg").replace(".png", "-crop.png")
        cropped.save(out)
        print(f"  裁剪后: {crop_h}x{h} -> {out}")
        return out
    return None

if __name__ == "__main__":
    for p in [r"C:\cxy\cmp1.jpg", r"E:\cxy\instrument-site\public\uploads\product\2026\sna5006x-e.jpg"]:
        analyze(p)
