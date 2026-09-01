# 改进促销区边界检测：检测红色文字+红色背景的完整促销区
from PIL import Image
import os

def is_redish(px):
    r, g, b = px
    return r > 140 and r > g * 1.4 and r > b * 1.4

def is_promo_row(px, y, w, step=3):
    """行内红色像素占比（含文字与背景）"""
    total = 0; red = 0
    for x in range(0, w, step):
        total += 1
        if is_redish(px[x, y]):
            red += 1
    return red / total

def analyze(path, show_rows=False):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    # 从底部向上，统计每行红色占比，找促销区顶边（连续高红区的最顶）
    ratios = []
    for y in range(h):
        ratios.append(is_promo_row(px, y, w))
    # 促销区 = 底部连续红色占比>6%的区域
    promo_top = None
    for y in range(h - 1, 0, -1):
        if ratios[y] > 0.06:
            promo_top = y
        else:
            if promo_top is not None:
                break
    print(f"{os.path.basename(path)}: {w}x{h} 促销区顶边={promo_top} ({promo_top/h*100 if promo_top else 0:.0f}%)")
    if show_rows:
        for y in range(h - 1, h - 200, -20):
            print(f"  y={y} red%={ratios[y]:.2f}")
    return promo_top

if __name__ == "__main__":
    tests = [
        r"E:\cxy\instrument-site\public\uploads\product\2026\sna5006x-e.jpg",
        r"E:\cxy\instrument-site\public\uploads\product\2026\sds5054x-hd.jpg",
        r"E:\cxy\instrument-site\public\uploads\product\2026\sps5041x.jpg",
        r"E:\cxy\instrument-site\public\uploads\product\2026\sdm4065a.jpg",
        r"C:\cxy\cmp1.jpg",
    ]
    for p in tests:
        if os.path.exists(p):
            analyze(p)
