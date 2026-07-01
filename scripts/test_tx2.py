import requests,json
KEY="db0f7949-5202-450b-a7b9-64f7803a4bea"
addr="BwaVFCDJ4HfRfFWq1S23LHkk5VF4GKEw9oz7F1PxgcHv"
url=f"https://api.helius.xyz/v0/addresses/{addr}/transactions?api-key={KEY}&limit=3"
r=requests.get(url,timeout=15)
print("status:",r.status_code)
if r.status_code==200:
    data=r.json()
    print("txs:",len(data))
    if data:
        tx=data[0]
        print("keys:",list(tx.keys()))
        print("nativeTransfers:",tx.get("nativeTransfers",[])[:3])
else:
    print("error:",r.text[:200])
