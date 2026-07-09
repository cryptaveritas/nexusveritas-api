import psycopg2
import os
import json
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()

print('Finding new clusters in Q3 2024 data...')

cur.execute("""
SELECT 
    behavior->'structural'->>'top_funder' as funder,
    COUNT(*) as wallet_count,
    COUNT(DISTINCT DATE(CAST(behavior->'structural'->>'first_seen' AS timestamp))) as unique_days,
    MIN(behavior->'structural'->>'first_seen') as first_seen,
    MAX(behavior->'structural'->>'first_seen') as last_seen
FROM creators
WHERE behavior->'structural'->>'top_funder' IS NOT NULL
    AND behavior->'structural'->>'top_funder' != 'null'
    AND cluster_id IS NULL
GROUP BY behavior->'structural'->>'top_funder'
HAVING COUNT(*) >= 5
ORDER BY wallet_count DESC
LIMIT 30
""")

rows = cur.fetchall()
print(f'New clusters found: {len(rows)}')
print()

high = [r for r in rows if r[2] == 1]
medium = [r for r in rows if r[2] > 1]

print(f'HIGH confidence (unique_days=1): {len(high)}')
for r in high:
    print(f'  wallets={r[1]:3} days={r[2]:2} first={str(r[3])[:10]} funder={r[0][:16]}...')

print(f'\nMEDIUM confidence (unique_days>1): {len(medium)}')
for r in medium:
    print(f'  wallets={r[1]:3} days={r[2]:2} first={str(r[3])[:10]} funder={r[0][:16]}...')

# Tag new clusters
if rows:
    print('\nTagging new clusters...')
    # Get current max cluster number
    cur.execute("SELECT cluster_id FROM creators WHERE cluster_id IS NOT NULL GROUP BY cluster_id ORDER BY cluster_id DESC LIMIT 1")
    last = cur.fetchone()
    last_num = int(last[0].split('-')[1]) if last else 0
    
    tagged = 0
    for i, row in enumerate(rows):
        funder, wallet_count, unique_days = row[0], row[1], row[2]
        cluster_id = f'CL-{last_num + i + 1:03d}'
        cur.execute("""
            UPDATE creators 
            SET cluster_id = %s, cluster_size = %s
            WHERE behavior->'structural'->>'top_funder' = %s
            AND cluster_id IS NULL
        """, (cluster_id, wallet_count, funder))
        tagged += cur.rowcount
    
    conn.commit()
    print(f'Tagged {tagged} operators in {len(rows)} new clusters')
    print(f'New cluster IDs: CL-{last_num+1:03d} through CL-{last_num+len(rows):03d}')

cur.close()
conn.close()
print('\nDone!')
