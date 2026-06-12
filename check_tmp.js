const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();
const agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
const HELIUS_KEY = process.env.HELIUS_API_KEY;

const wallets = [
  'CTVF8GZHavxdkrBMJBpMygcyKTaxiHWtLxXRWaeWuNHT',
  'Ctj86t1MPmsyqi9NpRoRW8YveUkukquUNsdVpyVbBrRv',
  'ENFSrQp5LqL3nrtfT7PPqL9bULRGAgEfceA9odWBdvzt',
  '2TX53ajRudwNhbMbYfPn6StdsFLMYAUmJYt49gvHcBBB',
  'hQz4h2VJUvhAUvqkDrnjE1UNcAwqG6jRQPU5vP6sGG9',
  '6eSP86sKpZAWEpvXD4mAs75VVRn7X6NvsQ9Xr8zR6ghi',
  '89Yvf4k1JVS5Mk4azFftUzQHTvvz5MbhDq5yxBCexevX',
  'EknteZnWBsfu6BDAzAZxGQKECdwmyvh8461hBfrnUgjR',
];

async function checkWallet(addr) {
  const url = `https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${HELIUS_KEY}&limit=50`;
  const res = await fetch(url, {agent});
  const txs = await res.json();
  if (!Array.isArray(txs) || txs.length === 0) return { addr, status: 'empty', tokens: [] };
  
  const tokens = new Set();
  for (const tx of txs) {
    for (const t of (tx.tokenTransfers || [])) {
      if (t.mint) tokens.add(t.mint);
    }
  }
  return {
    addr,
    tx_count: txs.length,
    tokens_seen: tokens.size,
    tokens: [...tokens].slice(0, 5),
    first_tx: txs[txs.length-1]?.timestamp 
      ? new Date(txs[txs.length-1].timestamp*1000).toISOString().split('T')[0] 
      : '?',
  };
}

async function main() {
  for (const w of wallets) {
    const r = await checkWallet(w);
    console.log(`${r.addr.slice(0,8)}... txs:${r.tx_count ?? 0} tokens:${r.tokens_seen ?? 0} first:${r.first_tx ?? '?'}`);
    if (r.tokens?.length) console.log('  mints:', r.tokens.join(', '));
  }
}
main().catch(e => console.error(e.message));
