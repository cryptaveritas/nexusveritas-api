const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');
require('dotenv').config();

const agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
const HELIUS_KEY = process.env.HELIUS_API_KEY;
const knownServices = JSON.parse(fs.readFileSync('./data/knownServices.json','utf8'));
const KNOWN_SET = new Set(knownServices.addresses.map(a => a.address?.toLowerCase()).filter(Boolean));
const CONCURRENCY = 5;

async function rpc(method, params) {
  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({jsonrpc:'2.0',id:1,method,params}), agent,
    });
    return (await res.json()).result;
  } catch { return null; }
}

async function getCreator(mint) {
  try {
    const sigs = await rpc('getSignaturesForAddress', [mint, {limit:1}]);
    if (!sigs?.length) return null;
    const oldest = await rpc('getSignaturesForAddress', [mint, {limit:1000}]);
    const lastSig = oldest?.[oldest.length-1]?.signature;
    if (!lastSig) return null;
    const tx = await rpc('getTransaction', [lastSig, {maxSupportedTransactionVersion:0}]);
    const keys = tx?.transaction?.message?.accountKeys || tx?.transaction?.message?.staticAccountKeys;
    return keys?.[0] ? (typeof keys[0]==='string' ? keys[0] : keys[0].pubkey) : null;
  } catch { return null; }
}

async function getFunding(addr) {
  try {
    const url = `https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${HELIUS_KEY}&limit=50&type=TRANSFER`;
    const txs = await (await fetch(url,{agent})).json();
    if (!Array.isArray(txs)) return null;
    const inc = new Map();
    const out = new Set(); // addresses that received SOL from addr
    let first_seen=null;
    for (const tx of txs) {
      const date = tx.timestamp ? new Date(tx.timestamp*1000).toISOString().split('T')[0] : null;
      if (date && (!first_seen||date<first_seen)) first_seen=date;
      for (const t of (tx.nativeTransfers||[])) {
        // incoming: someone → addr
        if (t.toUserAccount===addr && t.amount>=500000) {
          const f=t.fromUserAccount;
          if (!f||f===addr||KNOWN_SET.has(f.toLowerCase())) continue;
          const e=inc.get(f)??{count:0,sol:0};
          e.count++;e.sol+=t.amount/1e9;inc.set(f,e);
        }
        // outgoing: addr → someone
        if (t.fromUserAccount===addr && t.amount>=500000) {
          const to=t.toUserAccount;
          if (to && to!==addr && !KNOWN_SET.has(to.toLowerCase())) out.add(to);
        }
      }
    }
    // recycling_loop: addr received from X and also sent back to X
    const recycling_loop = [...inc.keys()].some(f => out.has(f));
    const total=[...inc.values()].reduce((s,e)=>s+e.sol,0);
    const sorted=[...inc.entries()].sort((a,b)=>b[1].count-a[1].count);
    const top=sorted[0];
    const conc=top&&total>0?Math.round((top[1].sol/total)*100)/100:0;
    const wallet_age=first_seen?Math.round((new Date()-new Date(first_seen))/86400000):0;
    return {transfer_count:sorted.reduce((s,[,v])=>s+v.count,0),total_incoming_sol:Math.round(total*10000)/10000,avg_transfer_sol:inc.size>0?Math.round((total/sorted.reduce((s,[,v])=>s+v.count,0))*10000)/10000:0,funding_sources_count:inc.size,funding_concentration:conc,wallet_age_days:wallet_age,first_seen,recycling_loop,split_init_pattern:false};
  } catch { return null; }
}

async function getOps(addr) {
  try {
    const sigs = await rpc('getSignaturesForAddress',[addr,{limit:1000}]);
    if (!sigs?.length) return {tokens_created:0,days_active:0,total_signatures:0,launch_frequency:0};
    const n=sigs[0].blockTime, o=sigs[sigs.length-1].blockTime;
    const days=n&&o?Math.round((n-o)/86400):0;
    return {tokens_created:Math.floor(sigs.length/4),days_active:days,total_signatures:sigs.length,launch_frequency:days>0?Math.round((Math.floor(sigs.length/4)/days)*10)/10:0};
  } catch { return {tokens_created:0,days_active:0,total_signatures:0,launch_frequency:0}; }
}

async function processLine(line) {
  try {
    const parts = line.trim().split(' ');
    const mint = parts[0], liq = parseFloat((parts[1]||'liq:0').replace('liq:',''));
    if (!mint||mint.length<32) return null;
    const creator = await Promise.race([getCreator(mint), new Promise((_,r)=>setTimeout(()=>r(new Error('t')),15000))]).catch(()=>null);
    if (!creator) return null;
    const [funding, ops] = await Promise.race([
      Promise.all([getFunding(creator), getOps(creator)]),
      new Promise((_,r)=>setTimeout(()=>r(new Error('t')),20000))
    ]).catch(()=>[null,{tokens_created:0,days_active:0,total_signatures:0,launch_frequency:0}]);
    return JSON.stringify({mint,liq_usd:liq,creator,behavior_profile:{structural:{wallet_age_days:funding?.wallet_age_days??0,funding_sources_count:funding?.funding_sources_count??0,funding_concentration:funding?.funding_concentration??0,first_seen:funding?.first_seen??null},behavioral:{transfer_count:funding?.transfer_count??0,avg_transfer_sol:funding?.avg_transfer_sol??0,total_incoming_sol:funding?.total_incoming_sol??0,recycling_loop:funding?.recycling_loop??false,split_init_pattern:funding?.split_init_pattern??false},operational:{tokens_created:ops.tokens_created,days_active:ops.days_active,total_signatures:ops.total_signatures,launch_frequency:ops.launch_frequency}}});
  } catch { return null; }
}

async function main() {
  const tokens = fs.readFileSync('./tokens_clean.txt','utf8').trim().split('\n').filter(Boolean);
  let i=0, done=0, start=Date.now();
  while(i<tokens.length) {
    const batch=tokens.slice(i,i+CONCURRENCY);
    const results=await Promise.all(batch.map(t=>processLine(t)));
    for (const r of results) if(r) console.log(r);
    i+=CONCURRENCY; done+=batch.length;
    if(done%20===0) console.error(`Progress: ${done}/${tokens.length} in ${Math.round((Date.now()-start)/1000)}s`);
  }
}
main().catch(console.error);
