import urllib.request
import json
import time
import csv

API_KEY = "l5ROLaqAlHZ3DBnxZ8yyEoOLLXogcx3C"
EXECUTION_ID = "01KVXM7CSEDAE87MB8Q0Y9VCAX"
OUTPUT = "C:/Users/User/Desktop/nexusveritas-api/pump_deployers_2to10.csv"

offset = 0
limit = 100
total = 0

with open(OUTPUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['deployer','tokens_created','first_seen','last_seen'])
    
    while offset < 100000:
        url = f"https://api.dune.com/api/v1/execution/{EXECUTION_ID}/results?limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={"x-dune-api-key": API_KEY})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read())
                rows = data.get("result", {}).get("rows", [])
                if not rows:
                    break
                for r in rows:
                    writer.writerow([r['deployer'], r['tokens_created'], r['first_seen'], r['last_seen']])
                f.flush()
                total += len(rows)
                print(f"Downloaded: {total}/100000", end="\r")
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

print(f"\nDone! Total: {total} rows saved to {OUTPUT}")
