# -*- coding: utf-8 -*-
"""清理福禄克产品介绍里的无关内容（地区列表等）"""
import psycopg2, re

BRAND = "92c09b46-32f6-4425-bf3b-0bd4825da642"
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()

cur.execute(
    """SELECT p.id, p.model, t.description FROM "Product" p
       LEFT JOIN "ProductTranslation" t ON t."productId"=p.id AND t.locale='zh'
       WHERE p."brandId"=%s AND t.description LIKE '%Africa%'""",
    (BRAND,),
)
rows = cur.fetchall()
print(f"需要清理的产品: {len(rows)}")

for pid, model, desc in rows:
    if not desc:
        continue
    # 去掉地区列表（AfricaEnglish、AfricaFrançais 等）
    cleaned = re.sub(r'(AfricaEnglish|AfricaFrançais|Middle EastEnglish|Americas|ArgentinaEspañol|ColombiaEspañol|BoliviaEspañol|BrazilPortuguês|ChileEspañol|MexicoEspañol|PeruEspañol|UruguayEspañol|VenezuelaEspañol|AsiaPacificEnglish|AustraliaEnglish|China简体中文|HongKongEnglish|IndiaEnglish|IndonesiaEnglish|Japan日本語|Korea한국어|MalaysiaEnglish|NewZealandEnglish|PhilippinesEnglish|SingaporeEnglish|Taiwan繁體中文|ThailandEnglish|VietnamEnglish|EuropeEnglish|AustriaDeutsch|BelgiumFrançais|BelgiumNederlands|CzechRepublicČeština|FranceFrançais|GermanyDeutsch|HungaryMagyar|ItalyItaliano|NetherlandsNederlands|PolandPolski|PortugalPortuguês|RomaniaRomână|RussiaРусский|SlovakiaSlovenčina|SpainEspañol|SwedenSvenska|TurkeyTürkçe|UkraineУкраїнська|UnitedKingdomEnglish)[,\s]*/gi', '', desc)
    # 去掉空的列表项
    cleaned = re.sub(r'[•·-]\s*[\r\n]+', '', cleaned)
    cleaned = cleaned.strip()
    if cleaned != desc:
        cur.execute(
            'UPDATE "ProductTranslation" SET "description"=%s WHERE "productId"=%s AND locale=%s',
            (cleaned, pid, "zh"),
        )

conn.commit()
cur.close()
conn.close()
print("清理完成")
