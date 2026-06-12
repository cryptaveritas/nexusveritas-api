
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
const readline = require('readline');
require('dotenv').config();

const agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
const HELIUS_KEY = process.env.HELIUS_API_KEY;
const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=' + HELIUS_KEY;

const knownServices = JSON.parse(require('fs').readFileSync('./data/knownServices.json','utf8'));
const KNOWN_SET = new Set(knownServices.addresses.map(a => a.toLowerCase()));

async function rpc(method, params) {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({jsonrpc:'2.0',id:1,method,params}), agent,
    });
    return (await res.json()).result;
  } catch { return null; }
}

async function getCreator(mint) {
  try {
    let lastSig, oldestSig = null;
    for (let i = 0; i < 3; i++) {
      const params = {limit:1000};
      if (lastSig) params.before = lastSig;
      const sigs = await rpc('getSignaturesForAddress', [mint, params]);
      if (!sigs || sigs.length === 0) break;
      oldestSig = sigs[sigs.length-1].signature;
      if (sigs.length < 1000) break;
      lastSig = oldestSig;
    }
    if (!oldestSig) return null;
    const tx = await rpc('getTransaction', [oldestSig, {encoding:'jsonParsed',maxSupportedTransactionVersion:0}]);
    if (!tx?.transaction?.message?.accountKeys) return null;
    const firstKey = tx.transaction.message.accountKeys[0];
    return typeof firstKey === 'string' ? firstKey : firstKey?.pubkey ?? null;
  } catch { return null; }
}

async function getOperationalSignals(creatorAddress) {
  try {
    let lastSig; const allSigs = [];
    for (let i = 0; i < 3; i++) {
      const params = {limit:1000};
      if (lastSig) params.before = lastSig;
      const sigs = await rpc('getSignaturesForAddress', [creatorAddress, params]);
      if (!sigs || sigs.length === 0) break;
      allSigs.push(...sigs);
      if (sigs.length < 1000) break;
      lastSig = sigs[sigs.length-1].signature;
    }
    if (allSigs.length === 0) return {tokens_created:0, days_active:0, total_signatures:0};
    const newest = allSigs[0].blockTime;
    const oldest = allSigs[allSigs.length-1].blockTime;
    const days_active = (newest && oldest) ? Math.round((newest - oldest) / 86400) : 0;
    const tokens_created = Math.floor(allSigs.length / 4);
    return {tokens_created, days_active, total_signatures: allSigs.length};
  } catch { return {tokens_created:0, days_active:0, total_signatures:0}; }
}

async function getFundingProfile(creatorAddress) {
  try {
    const url = 'https://api.helius.xyz/v0/addresses/' + creatorAddress + '/transactions?api-key=' + HELIUS_KEY + '&limit=100&type=TRANSFER';
    const txs = await (await fetch(url, {agent})).json();
    if (!Array.isArray(txs) || txs.length === 0) return null;

    const incoming = new Map();
    let first_seen = null, last_seen = null;

    for (const tx of txs) {
      const date = tx.timestamp ? new Date(tx.timestamp*1000).toISOString().split('T')[0] : null;
      if (date) {
        if (!first_seen || date < first_seen) first_seen = date;
        if (!last_seen  || date > last_seen)  last_seen  = date;
      }
      for (const t of (tx.nativeTransfers || [])) {
        if (t.toUserAccount !== creatorAddress || t.amount < 500000) continue;
        const f = t.fromUserAccount;
        if (!f || f === creatorAddress || KNOWN_SET.has(f.toLowerCase())) continue;
        const e = incoming.get(f) ?? {count:0, sol:0};
        e.count++; e.sol += t.amount/1e9; incoming.set(f, e);
      }
    }

    const total_sol = [...incoming.values()].reduce((s,e) => s+e.sol, 0);
    const sorted = [...incoming.entries()].sort((a,b) => b[1].count - a[1].count);
    const top = sorted[0];
    const funding_concentration = top && total_sol > 0 ? Math.round((top[1].sol/total_sol)*100)/100 : 0;
    const wallet_age_days = (first_seen && last_seen)
      ? Math.round((new Date(last_seen) - new Date(first_seen)) / 86400000) : 0;

    // Detect split_init_pattern: total ~0.002 SOL, 2+ funders, each single-use
    const total_rounded = Math.round(total_sol * 1000) / 1000;
    const all_single_use = sorted.every(([,v]) => v.count === 1);
    const split_init_pattern = incoming.size >= 2 && total_rounded <= 0.005 && all_single_use;

    // Detect recycling_loop: check if top funder also received from creator
    let recycling_loop = false;
    if (top) {
      const outUrl = 'https://api.helius.xyz/v0/addresses/' + creatorAddress + '/transactions?api-key=' + HELIUS_KEY + '&limit=50&type=TRANSFER';
      const outTxs = await (await fetch(outUrl, {agent})).json();
      if (Array.isArray(outTxs)) {
        for (const tx of outTxs) {
          for (const t of (tx.nativeTransfers || [])) {
            if (t.fromUserAccount === creatorAddress && t.toUserAccount === top[0]) {
              recycling_loop = true; break;
            }
          }
          if (recycling_loop) break;
        }
      }
    }

    return {
      top_funder: top?.[0] ?? null,
      transfer_count: sorted.reduce((s,[,v]) => s+v.count, 0),
      total_incoming_sol: Math.round(total_sol*10000)/10000,
      avg_transfer_sol: incoming.size > 0 ? Math.round((total_sol / sorted.reduce((s,[,v])=>s+v.count,0))*10000)/10000 : 0,
      funding_sources_count: incoming.size,
      funding_concentration,
      wallet_age_days,
      first_seen,
      recycling_loop,
      split_init_pattern,
    };
  } catch { return null; }
}

async function main() {
  const rl = readline.createInterface({input: process.stdin});
  let _count = 0; let _start = Date.now();
  for await (const line of rl) {
    _count++;
    if (_count % 10 === 0) {
      const elapsed = Math.round((Date.now()-_start)/1000);
      console.error(`Progress: ${_count} tokens processed in ${elapsed}s`);
    }
    const parts = line.trim().split(' ');
    const mint = parts[0];
    const liq = parts[1]?.replace('liq:','') ?? '0';
    if (!mint || mint.length < 32) continue;

    const creator = await getCreator(mint);
    if (!creator) { console.error('no creator: '+mint.slice(0,8)); continue; }

    const [funding, operational] = await Promise.race([
      Promise.all([getFundingProfile(creator), getOperationalSignals(creator)]),
      new Promise((_,r) => setTimeout(() => r(new Error("timeout")), 20000))
    ]).catch(e => { console.error("skip:" + creator.slice(0,8)); return [null, {tokens_created:0,days_active:0,total_signatures:0,launch_frequency:0}]; });

    const profile = {
      mint,
      liq_usd: parseFloat(liq),
      creator,
      behavior_profile: {
        structural: {
          wallet_age_days: funding?.wallet_age_days ?? 0,
          funding_sources_count: funding?.funding_sources_count ?? 0,
          funding_concentration: funding?.funding_concentration ?? 0,
          first_seen: funding?.first_seen ?? null,
        },
        behavioral: {
          transfer_count: funding?.transfer_count ?? 0,
          avg_transfer_sol: funding?.avg_transfer_sol ?? 0,
          total_incoming_sol: funding?.total_incoming_sol ?? 0,
          recycling_loop: funding?.recycling_loop ?? false,
          split_init_pattern: funding?.split_init_pattern ?? false,
        },
        operational: {
          tokens_created: operational.tokens_created,
          days_active: operational.days_active,
          total_signatures: operational.total_signatures,
          launch_frequency: operational.days_active > 0
            ? Math.round((operational.tokens_created / operational.days_active) * 10) / 10
            : 0,
        },
      },
    };

    console.log(JSON.stringify(profile));
    console.error('done: '+creator.slice(0,8)+'...');
  }
}

main().catch(e => console.error(e.message));
