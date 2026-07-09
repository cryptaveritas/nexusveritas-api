import subprocess, json, os, datetime
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ.get('DATABASE_URL')
CLASSIFY_JS = '/app/operator_classify.js'
BATCH_SIZE = 1000

print('Connecting to DB...')
conn = psycopg2.connect(DB_URL)
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM creators')
total = cur.fetchone()[0]
print(f'Total operators: {total}')

SQL = """SELECT address, behavior, tokens_created, days_active, total_signatures, 0.3 as signal_coverage FROM creators ORDER BY address"""
cur.execute(SQL)
rows = cur.fetchall()
print(f'Loaded {len(rows)} operators, starting reclassification...')

updated = 0
errors = 0

for i in range(0, len(rows), BATCH_SIZE):
    chunk = rows[i:i+BATCH_SIZE]
    lines = []
    for row in chunk:
        address, behavior, tokens_created, days_active, total_signatures, signal_coverage = row
        behavior = behavior or {}
        profile = {
            'mint': None, 'liq_usd': 0, 'creator': address,
            'signal_coverage': float(signal_coverage or 0.3),
            'behavior_profile': {
                'structural': behavior.get('structural', {'wallet_age_days': days_active or 0, 'funding_sources_count': None, 'funding_concentration': None, 'first_seen': None, 'top_funder': None}),
                'behavioral': behavior.get('behavioral', {'transfer_count': 0, 'avg_transfer_sol': 0, 'total_incoming_sol': None, 'recycling_loop': None, 'split_init_pattern': None}),
                'operational': behavior.get('operational', {'tokens_created': tokens_created or 0, 'days_active': days_active or 0, 'total_signatures': total_signatures or 0, 'launch_frequency': 0})
            }
        }
        lines.append(json.dumps(profile))
    result = subprocess.run(['node', CLASSIFY_JS], input='\n'.join(lines)+'\n', capture_output=True, text=True, cwd='/app')
    if result.returncode != 0:
        errors += len(chunk)
        print(f'\nERROR batch {i}: {result.stderr[:200]}')
        continue
    update_data = []
    for line in [l for l in result.stdout.strip().split('\n') if l.strip()]:
        try:
            r = json.loads(line)
            update_data.append((r['operator_class'], r['confidence'], r['baseline_risk'], r['matched_signals'], r['creator']))
        except:
            errors += 1
    if update_data:
        cur.executemany('UPDATE creators SET archetype=%s, confidence=%s, baseline_risk=%s, matched_signals=%s WHERE address=%s', update_data)
        conn.commit()
        updated += len(update_data)
    ts = datetime.datetime.now().strftime('%H:%M:%S')
    print(f'[{ts}] {min(i+BATCH_SIZE, total)}/{total} updated={updated} errors={errors}', end='\r', flush=True)

print(f'\nDone! Updated={updated} Errors={errors}')
cur.execute('SELECT archetype, COUNT(*) FROM creators GROUP BY archetype ORDER BY COUNT(*) DESC')
print('\nNew distribution:')
for row in cur.fetchall():
    print(f'  {row[0]}: {row[1]}')
cur.close()
conn.close()
