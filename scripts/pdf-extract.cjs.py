import pymupdf, sys

doc = pymupdf.open(r"E:\cxy\instrument-site\datasheets\SDS1000X-E_EN.pdf")
print("pages:", doc.page_count)
out = []
for i, page in enumerate(doc):
    txt = page.get_text()
    out.append(f"\n===== PAGE {i+1} =====\n" + txt)
with open(r"E:\cxy\instrument-site\datasheets\sds1000xe.txt", "w", encoding="utf-8") as f:
    f.write("".join(out))
print("written", sum(len(x) for x in out), "chars")
