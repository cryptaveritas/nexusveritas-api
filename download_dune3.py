import urllib.request
import json
import time
import csv

API_KEY = "l5ROLaqAlHZ3DBnxZ8yyEoOLLXogcx3C"
EXECUTION_ID = "01KVWVXP7TN3Q4K79JJ1HQA2YN"
OUTPUT = "C:/Users/User/Desktop/nexusveritas-api/pump_deployers.csv"

# Start from where we left off
offset = 2000
limit = 100
total = 2000

with open(OUTPUT, 'a', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    
    while offset < 50000:
        url = f"https://api.dune.com/api/v1/execution/{EXECUTION_ID}/results?limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={"x-dune-api-key": API_KEY})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read())
                rows = data.get("result", {}).get("rows", [])
                if not rows:
                    print(f"\nNo more rows at offset {offset}")
                    break
                for r in rows:
                    writer.writerow([r['deployer'], r['tokens_created'], r['first_seen'], r['last_seen']])
                f.flush()
                total += len(rows)
                print(f"Downloaded: {total}/50000", end="\r")
                if len(rows) < limit:
                    break
                offset += limit
                time.sleep(2)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"\nRate limit at {offset}, waiting 60s...")
                time.sleep(60)
            else:
                print(f"\nHTTP Error {e.code} at offset {offset}")
                break
        except Exception as e:
            print(f"\nError at offset {offset}: {e}")
            time.sleep(10)

print(f"\nDone! Total: {total} rows")
