const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();
const agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
const HELIUS_KEY = process.env.HELIUS_API_KEY;
const addr = 'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE';
async function run() {
  let cursor; const all = [];
  for (let p = 0; p < 10; p++) {
    let url = `https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${HELIUS_KEY}&limit=100&type=TRANSFER`;
    if (cursor) url += `&before=${cursor}`;
    const res = await fetch(url, {agent});
    const txs = await res.json();
    if (!Array.isArray(txs) || txs.length === 0) break;
    all.push(...txs);
    console.error(`page ${p+1}: ${txs.length} txs`);
    if (txs.length < 100) break;
    cursor = txs[txs.length-1].signature;
  }
  const out = new Map();
  for (const tx of all) {
    for (const t of (tx.nativeTransfers || [])) {
      if (t.fromUserAccount !== addr || t.amount < 1000000) continue;
      const date = tx.timestamp ? new Date(tx.timestamp*1000).toISOString().split('T')[0] : '?';
      const e = out.get(t.toUserAccount) ?? {count:0, sol:0, first_seen:date, last_seen:date};
      e.count++;
      e.sol += t.amount/1e9;
      if (date < e.first_seen) e.first_seen = date;
      if (date > e.last_seen)  e.last_seen  = date;
      out.set(t.toUserAccount, e);
    }
  }
  console.log(`Unique recipients: ${out.size}`);
  for (const [w,d] of [...out.entries()].sort((a,b) => b[1].count - a[1].count))
    console.log(w, 'count:', d.count, 'sol:', d.sol.toFixed(4), 'first:', d.first_seen, 'last:', d.last_seen);
}
run().catch(e => console.error(e.message));
