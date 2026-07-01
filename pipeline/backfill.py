#!/usr/bin/env python3
import csv, os, sys, psycopg2
from dotenv import load_dotenv
load_dotenv('.env')

CSV = sys.argv[1] if len(sys.argv) > 1 else 'pump_deployers.csv'
conn = psycopg2.connect(os.environ['DATABASE_URL'])
conn.autocommit = True
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM creators')
print(f'Before: {cur.fetchone()[0]}')
inserted = skipped = errors = 0
with open(CSV, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        try:
            addr = row['deployer'].strip()
            fs = row.get('first_seen','').replace(' UTC','').strip() or None
            ls = row.get('last_seen','').replace(' UTC','').strip() or None
            tokens = int(row.get('tokens_created', 0))
            cur.execute("""
                INSERT INTO creators 
                (address,first_seen,last_seen,archetype,confidence,
                 tokens_created,days_active,total_signatures,
                 baseline_risk,vector_version,updated_at)
                VALUES (%s,%s,%s,'NEW_CREATOR',0.5,%s,0,%s,'low','v2.1',NOW())
                ON CONFLICT DO NOTHING
            """, (addr, fs, ls, tokens, tokens*4))
            if cur.rowcount > 0:
                inserted += 1
            else:
                skipped += 1
        except Exception as e:
            errors += 1
        if (i+1) % 10000 == 0:
            print(f'[{i+1}] inserted={inserted} skipped={skipped} errors={errors}', flush=True)
cur.execute('SELECT COUNT(*) FROM creators')
print(f'After: {cur.fetchone()[0]}')
print(f'Done! inserted={inserted} skipped={skipped} errors={errors}')
cur.close(); conn.close()
