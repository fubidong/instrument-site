from PIL import Image
import json

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

covers = json.load(open("C:/cxy/covers.json", encoding="utf-8"))
print("总数:", len(covers))
suspicious = []
for x in covers:
    r = red3(x["path"])
    if r > 20:
        suspicious.append((x["model"], r, x["path"]))
print("疑似广告(red3>20):", len(suspicious))
for m, r, p in suspicious:
    print("  ", m, r, p.split("/")[-1])
