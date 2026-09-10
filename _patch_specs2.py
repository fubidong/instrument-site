# -*- coding: utf-8 -*-
p = r"E:/cxy/instrument-site/src/app/admin/(protected)/products/actions.ts"
s = open(p, encoding="utf-8").read()

# 中文 upsert：create/update 块
zh_old_create = """          create: {
            productId: id,
            locale: "zh",
            name: nameZhFinal,
            summary: summaryZh || null,
            description: descriptionZh || null,
            selection: selectionZh || null,
          },"""
zh_new_create = """          create: {
            productId: id,
            locale: "zh",
            name: nameZhFinal,
            summary: summaryZh || null,
            description: descriptionZh || null,
            selection: selectionZh || null,
            specsOverview: specsZh || null,
          },"""
assert s.count(zh_old_create) == 1, "zh create block"
s = s.replace(zh_old_create, zh_new_create, 1)

zh_old_update = """          update: {
            name: nameZhFinal,
            summary: summaryZh || null,
            description: descriptionZh || null,
            selection: selectionZh || null,
          },"""
zh_new_update = """          update: {
            name: nameZhFinal,
            summary: summaryZh || null,
            description: descriptionZh || null,
            selection: selectionZh || null,
            specsOverview: specsZh || null,
          },"""
assert s.count(zh_old_update) == 1, "zh update block"
s = s.replace(zh_old_update, zh_new_update, 1)

# 英文 upsert
en_old_create = """          create: {
            productId: id,
            locale: "en",
            name: nameEnFinal,
            summary: summaryEn || null,
            description: descriptionEn || null,
            selection: selectionEn || null,
          },"""
en_new_create = """          create: {
            productId: id,
            locale: "en",
            name: nameEnFinal,
            summary: summaryEn || null,
            description: descriptionEn || null,
            selection: selectionEn || null,
            specsOverview: specsEn || null,
          },"""
assert s.count(en_old_create) == 1, "en create block"
s = s.replace(en_old_create, en_new_create, 1)

en_old_update = """          update: {
            name: nameEnFinal,
            summary: summaryEn || null,
            description: descriptionEn || null,
            selection: selectionEn || null,
          },"""
en_new_update = """          update: {
            name: nameEnFinal,
            summary: summaryEn || null,
            description: descriptionEn || null,
            selection: selectionEn || null,
            specsOverview: specsEn || null,
          },"""
assert s.count(en_old_update) == 1, "en update block"
s = s.replace(en_old_update, en_new_update, 1)

# 新建产品 create 块（两个 locale）
new_zh = """              {
                locale: "zh",
                name: nameZhFinal,
                summary: summaryZh || null,
                description: descriptionZh || null,
                selection: selectionZh || null,
              },"""
new_zh2 = """              {
                locale: "zh",
                name: nameZhFinal,
                summary: summaryZh || null,
                description: descriptionZh || null,
                selection: selectionZh || null,
                specsOverview: specsZh || null,
              },"""
assert s.count(new_zh) == 1, "new zh block"
s = s.replace(new_zh, new_zh2, 1)

new_en = """              {
                locale: "en",
                name: nameEnFinal,
                summary: summaryEn || null,
                description: descriptionEn || null,
                selection: selectionEn || null,
              },"""
new_en2 = """              {
                locale: "en",
                name: nameEnFinal,
                summary: summaryEn || null,
                description: descriptionEn || null,
                selection: selectionEn || null,
                specsOverview: specsEn || null,
              },"""
assert s.count(new_en) == 1, "new en block"
s = s.replace(new_en, new_en2, 1)

open(p, "w", encoding="utf-8", newline="").write(s)
print("all patched OK")
