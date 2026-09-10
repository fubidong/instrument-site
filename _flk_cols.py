# -*- coding: utf-8 -*-
import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/instrument_site")
cur = conn.cursor()
cur.execute("""SELECT column_name FROM information_schema.columns WHERE table_name='ProductTranslation' ORDER BY ordinal_position""")
for r in cur.fetchall():
    print(r[0])
cur.close()
conn.close()
