import requests
from dotenv import load_dotenv
load_dotenv()
KEY="db0f7949-5202-450b-a7b9-64f7803a4bea"
addr="BwaVFCDJ4HfRfFWq1S23LHkk5VF4GKEw9oz7F1PxgcHv"
RPC="https://mainnet.helius-rpc.com/?api-key="+KEY
r=requests.post(RPC,json={"jsonrpc":"2.0","id":1,"method":"getSignaturesForAddress","params":[addr,{"limit":5}]},timeout=15)
data=r.json()
print("status:",r.status_code)
sigs=data.get("result",[])
print("sigs:",len(sigs))
if sigs:print("first:",sigs[0])
