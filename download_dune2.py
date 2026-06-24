import urllib.request
import json
import time
import csv

API_KEY = "l5ROLaqAlHZ3DBnxZ8yyEoOLLXogcx3C"
EXECUTION_ID = "01KVWVXP7TN3Q4K79JJ1HQA2YN"
OUTPUT = "C:/Users/User/Desktop/nexusveritas-api/pump_deployers.csv"

offset = 0
limit = 100
total = 0

with open(OUTPUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['deployer','tokens_created','first_seen','last_seen'])
    
    while True:
        url = f"https://api.dune.com/api/v1/execution/{EXECUTION_ID}/results?limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={"x-dune-api-key": API_KEY})
        try:
            ctx = urllib.request.ssl._create_unverified_context() if hasattr(urllib.request, 'ssl') else None
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read())
                rows = data.get("result", {}).get("rows", [])
                if not rows:
                    break
                for r in rows:
                    writer.writerow([r['deployer'], r['tokens_created'], r['first_seen'], r['last_seen']])
                total += len(rows)
                print(f"Downloaded: {total}/50000", end="\r")
                if len(rows) < limit:
                    break
                offset += limit
                time.sleep(1.5)
        except Exception as e:
            print(f"\nError at offset {offset}: {e}")
            print("Retrying in 3s...")
            time.sleep(30)
            continue

print(f"\nDone! {total} rows saved to {OUTPUT}")
