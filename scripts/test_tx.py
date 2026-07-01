import requests,json
KEY="db0f7949-5202-450b-a7b9-64f7803a4bea"
RPC="https://mainnet.helius-rpc.com/?api-key="+KEY
sig="jLuY7WgU7gjcPgmX4DG4sZgMvb8f4cQY68zNuGfCpbwpXDW9JhmsGUX8CBB9Q4nbVtSsG7dheHqQFPFSfRdDhUi"
r=requests.post(RPC,json={"jsonrpc":"2.0","id":1,"method":"getTransaction","params":[sig,{"encoding":"json","maxSupportedTransactionVersion":0}]},timeout=15)
data=r.json()
result=data.get("result",{})
if result:
    meta=result.get("meta",{})
    tx=result.get("transaction",{})
    keys=tx.get("message",{}).get("accountKeys",[])
    pre=meta.get("preBalances",[])
    post=meta.get("postBalances",[])
    print("accounts:",len(keys))
    for i,k in enumerate(keys[:5]):
        delta=(post[i]-pre[i])/1e9 if i<len(post) else 0
        print(f"  {str(k)[:16]}... delta={delta:.4f} SOL")
else:
    print("no result:",data)
