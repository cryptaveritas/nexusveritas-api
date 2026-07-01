import psycopg2, os, json, subprocess
from dotenv import load_dotenv
import datetime

load_dotenv('C:/Users/User/Desktop/nexusveritas-api/.env')
conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()

cur.execute('SELECT COUNT(*) FROM creators')
total = cur.fetchone()[0]
print(f'[{datetime.datetime.now().strftime("%H:%M:%S")}] Rebuilding vectors for {total} operators...')

BATCH_SIZE = 1000
updated = 0
errors = 0

cur.execute('SELECT address, behavior, tokens_created, days_active, total_signatures, 0.3 as signal_coverage FROM creators ORDER BY address')
rows = cur.fetchall()

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
                'structural': behavior.get('structural', {
                    'wallet_age_days': days_active or 0,
                    'funding_sources_count': None,
                    'funding_concentration': None,
                    'first_seen': None,
                    'top_funder': None
                }),
                'behavioral': behavior.get('behavioral', {
                    'transfer_count': None,
                    'avg_transfer_sol': None,
                    'total_incoming_sol': None,
                    'recycling_loop': None,
                    'split_init_pattern': None
                }),
                'operational': behavior.get('operational', {
                    'tokens_created': tokens_created or 0,
                    'days_active': days_active or 0,
                    'total_signatures': total_signatures or 0,
                    'launch_frequency': 0
                })
            }
        }
        lines.append(json.dumps(profile))

    result = subprocess.run(
        ['node', '/app/operator_classify.js'],
        input='\n'.join(lines)+'\n',
        capture_output=True, text=True,
        cwd='/app'
    )
    if result.returncode != 0:
        errors += len(chunk)
        continue

    update_data = []
    for line in [l for l in result.stdout.strip().split('\n') if l.strip()]:
        try:
            r = json.loads(line)
            vec = r.get('vector_v2')
            if vec and len(vec) == 25:
                vec_str = '[' + ','.join(str(x) for x in vec) + ']'
                update_data.append((vec_str, r['creator']))
        except:
            errors += 1

    if update_data:
        cur.executemany(
            'UPDATE creators SET vector_v2=%s::vector, vector_version=%s WHERE address=%s',
            [(d[0], 'v2.1', d[1]) for d in update_data]
        )
        conn.commit()
        updated += len(update_data)

    ts = datetime.datetime.now().strftime('%H:%M:%S')
    print(f'[{ts}] {min(i+BATCH_SIZE,total)}/{total} updated={updated} errors={errors}', end='\r')

print(f'\n[{datetime.datetime.now().strftime("%H:%M:%S")}] Done! Updated={updated} Errors={errors}')
cur.close()
conn.close()
