#!/usr/bin/env python3
"""
Canonical backfill script -- replaces backfill_insert.js (TD-042)
Usage: python pipeline/backfill.py data/raw/pump_2025_01.csv
"""
import csv, os, sys, psycopg2
from dotenv import load_dotenv

load_dotenv('.env')

CSV = sys.argv[1] if len(sys.argv) > 1 else None
if not CSV:
    print('Usage: python pipeline/backfill.py <csv_file>')
    sys.exit(1)

# Validate CSV first
print(f'Validating {CSV}...')
bad_lines = []
with open(CSV, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        try:
            int(row['tokens_created'])
        except (ValueError, KeyError):
            bad_lines.append(i+2)

if bad_lines:
    print(f'ERROR: {len(bad_lines)} corrupted rows detected (e.g. lines {bad_lines[:5]})')
    print('File corrupted during resume download. Re-download from scratch.')
    sys.exit(1)

print('CSV valid. Starting backfill...')

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
        if (i+1) % 50000 == 0:
            print(f'[{i+1}] inserted={inserted} skipped={skipped} errors={errors}')

cur.execute('SELECT COUNT(*) FROM creators')
print(f'After: {cur.fetchone()[0]}')
print(f'Done! inserted={inserted} skipped={skipped} errors={errors}')
cur.close()
conn.close()
