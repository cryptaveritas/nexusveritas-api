import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()

cur.execute("""
    UPDATE creators
    SET data_source_quality = 'synthetic'
    WHERE data_source_quality = 'partial'
    AND (
        behavior->'structural'->>'top_funder' IS NULL
        OR behavior->'structural'->>'top_funder' = 'null'
    )
    AND (behavior->'behavioral'->>'total_incoming_sol')::float = 0
""")
print('Fixed:', cur.rowcount, 'operators -> synthetic')
conn.commit()
cur.close()
conn.close()
