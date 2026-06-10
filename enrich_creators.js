const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
const readline = require('readline');
require('dotenv').config();

const agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
const HELIUS_KEY = process.env.HELIUS_API_KEY;
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;

async function rpc(method, params) {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      agent,
    });
    const data = await res.json();
    return data.result;
  } catch { return null; }
}

async function getCreator(mint) {
  try {
    let lastSig, oldestSig = null;
    for (let i = 0; i < 3; i++) {
      const params = { limit: 1000 };
      if (lastSig) params.before = lastSig;
      const sigs = await rpc('getSignaturesForAddress', [mint, params]);
      if (!sigs || sigs.length === 0) break;
      oldestSig = sigs[sigs.length - 1].signature;
      if (sigs.length < 1000) break;
      lastSig = oldestSig;
    }
    if (!oldestSig) return null;
    const tx = await rpc('getTransaction', [oldestSig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
    if (!tx?.transaction?.message?.accountKeys) return null;
    const firstKey = tx.transaction.message.accountKeys[0];
    return typeof firstKey === 'string' ? firstKey : firstKey?.pubkey ?? null;
  } catch { return null; }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    const parts = line.trim().split(' ');
    const mint = parts[0];
    const liq = parts[2] ?? '0';
    if (!mint || mint.length < 32) continue;
    const creator = await getCreator(mint);
    if (creator) {
      console.log(`${mint} liq:${liq} creator:${creator}`);
    } else {
      console.error(`no creator for ${mint.slice(0,8)}...`);
    }
  }
}

main().catch(e => console.error(e.message));
