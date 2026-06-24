import urllib.request
import json
import time

API_KEY = "l5ROLaqAlHZ3DBnxZ8yyEoOLLXogcx3C"
EXECUTION_ID = "01KVWVXP7TN3Q4K79JJ1HQA2YN"
OUTPUT = "C:/Users/User/Desktop/nexusveritas-api/pump_deployers.csv"

offset = 0
limit = 500
total = 0
rows = []

print("Downloading pump.fun deployers from Dune...")

while True:
    url = f"https://api.dune.com/api/v1/execution/{EXECUTION_ID}/results?limit={limit}&offset={offset}"
    req = urllib.request.Request(url, headers={"x-dune-api-key": API_KEY})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            batch = data.get("result", {}).get("rows", [])
            if not batch:
                break
            rows.extend(batch)
            total += len(batch)
            offset += limit
            print(f"  Downloaded: {total} rows...", end="\r")
            if len(batch) < limit:
                break
            time.sleep(0.5)
    except Exception as e:
        print(f"\nError at offset {offset}: {e}")
        break

print(f"\nTotal rows: {total}")

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("deployer,tokens_created,first_seen,last_seen\n")
    for r in rows:
        f.write(f"{r['deployer']},{r['tokens_created']},{r['first_seen']},{r['last_seen']}\n")

print(f"Saved to {OUTPUT}")
