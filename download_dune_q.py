import urllib.request
import json
import time
import csv
import sys

API_KEY = "l5ROLaqAlHZ3DBnxZ8yyEoOLLXogcx3C"
EXECUTION_ID = sys.argv[1]
OUTPUT = sys.argv[2]
TOTAL = int(sys.argv[3]) if len(sys.argv) > 3 else 100000

offset = 0
limit = 1000  # increased from 100 for faster download
total = 0

with open(OUTPUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['deployer','tokens_created','first_seen','last_seen'])
    while True:
        url = f"https://api.dune.com/api/v1/execution/{EXECUTION_ID}/results?limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={"x-dune-api-key": API_KEY})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read())
                rows = data.get("result", {}).get("rows", [])
                if not rows: break
                for r in rows:
                    writer.writerow([r['deployer'], r['tokens_created'], r['first_seen'], r['last_seen']])
                f.flush()
                total += len(rows)
                print(f"Downloaded: {total}/{TOTAL}", end="\r")
                if len(rows) < limit: break
                offset += limit
                time.sleep(2)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"\nRate limit at {offset}, waiting 60s...")
                time.sleep(60)
            else:
                print(f"\nError {e.code}"); break
        except Exception as e:
            print(f"\nError: {e}"); time.sleep(10)

print(f"\nDone! {total} rows -> {OUTPUT}")
