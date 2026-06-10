const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');
require('dotenv').config();

const agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
const HELIUS_KEY = process.env.HELIUS_API_KEY;

const knownServices = JSON.parse(fs.readFileSync('./data/knownServices.json', 'utf8'));
const KNOWN_SET = new Set(knownServices.addresses.map(a => a.toLowerCase()));

const creators = process.argv.length > 2
  ? process.argv.slice(2)
  : fs.readFileSync("/dev/stdin","utf8").trim().split("\n").map(l=>l.trim()).filter(Boolean);

async function getCreatorProfile(addr) {
  try {
    const url = `https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${HELIUS_KEY}&limit=100&type=TRANSFER`;
    const txs = await (await fetch(url, {agent})).json();
    if (!Array.isArray(txs) || txs.length === 0) return { creator: addr, top_funder: null };

    const incoming = new Map();
    let first_seen = null, last_seen = null;

    for (const tx of txs) {
      const date = tx.timestamp ? new Date(tx.timestamp*1000).toISOString().split('T')[0] : null;
      if (date) {
        if (!first_seen || date < first_seen) first_seen = date;
        if (!last_seen  || date > last_seen)  last_seen  = date;
      }
      for (const t of (tx.nativeTransfers || [])) {
        if (t.toUserAccount !== addr || t.amount < 1000000) continue;
        const from = t.fromUserAccount;
        if (!from || from === addr || KNOWN_SET.has(from.toLowerCase())) continue;
        const e = incoming.get(from) ?? {count: 0, sol: 0};
        e.count++;
        e.sol += t.amount / 1e9;
        incoming.set(from, e);
      }
    }

    const total_sol = [...incoming.values()].reduce((s, e) => s + e.sol, 0);
    const sorted = [...incoming.entries()].sort((a, b) => b[1].count - a[1].count);
    const top = sorted[0] ?? null;
    const funding_concentration = top && total_sol > 0
      ? Math.round((top[1].sol / total_sol) * 100) / 100 : 0;

    return {
      creator: addr,
      top_funder: top?.[0] ?? null,
      top_funder_transfers: top?.[1].count ?? 0,
      top_funder_sol: top ? Math.round(top[1].sol * 10000) / 10000 : 0,
      total_funding_sources: incoming.size,
      funding_concentration,
      first_seen,
      last_seen,
    };
  } catch { return { creator: addr, top_funder: null }; }
}

function buildConfidence(hub) {
  const signals = [];
  let score = 0;

  // Signal 1: funding overlap (base)
  if (hub.creator_count >= 2) { signals.push('funding_overlap'); score += 0.25; }
  if (hub.creator_count >= 4) { score += 0.15; }
  if (hub.creator_count >= 8) { score += 0.15; }

  // Signal 2: temporal proximity
  const dates = hub.creators.map(c => c.first_seen).filter(Boolean).sort();
  if (dates.length >= 2) {
    const span = (new Date(dates[dates.length-1]) - new Date(dates[0])) / 86400000;
    if (span <= 7)  { signals.push('temporal_proximity_7d');  score += 0.15; }
    else if (span <= 30) { signals.push('temporal_proximity_30d'); score += 0.08; }
  }

  // Signal 3: high funding concentration
  const highConc = hub.creators.filter(c => c.funding_concentration >= 0.9);
  if (highConc.length >= 2) { signals.push('high_funding_concentration'); score += 0.10; }

  // Placeholder slots for future signals
  // signals.push('shared_exit_wallet')   → +0.20
  // signals.push('shared_deploy_pattern') → +0.15
  // signals.push('shared_social')         → +0.15

  return { score: Math.min(Math.round(score * 100) / 100, 1.0), signals };
}

async function main() {
  console.error(`Scanning ${creators.length} creators...`);

  // Step 1: Creator profiles
  const profiles = [];
  for (let i = 0; i < creators.length; i++) {
    const p = await getCreatorProfile(creators[i]);
    profiles.push(p);
    console.error(`[${i+1}/${creators.length}] ${p.creator.slice(0,8)}... funder:${p.top_funder?.slice(0,8) ?? 'none'}... conc:${p.funding_concentration}`);
  }

  // Step 2: Funding hubs
  const hubMap = new Map();
  for (const p of profiles) {
    if (!p.top_funder || p.top_funder === p.creator) continue;
    const group = hubMap.get(p.top_funder) ?? [];
    group.push(p);
    hubMap.set(p.top_funder, group);
  }

  const hubs = [...hubMap.entries()].map(([wallet, list]) => {
    const dates = list.map(c => c.first_seen).filter(Boolean).sort();
    return {
      hub_wallet: wallet,
      creator_count: list.length,
      first_seen: dates[0] ?? null,
      last_seen: dates[dates.length-1] ?? null,
      creators: list,
    };
  }).sort((a, b) => b.creator_count - a.creator_count);

  // Step 3: Cluster candidates
  const clusters = hubs
    .filter(h => h.creator_count >= 2)
    .map((hub, i) => {
      const { score, signals } = buildConfidence(hub);
      return {
        cluster_id: `CLUSTER_${String(i+2).padStart(3,'0')}`,
        hub_wallet: hub.hub_wallet,
        creator_count: hub.creator_count,
        first_seen: hub.first_seen,
        last_seen: hub.last_seen,
        confidence_score: score,
        signals,
        status: score >= 0.6 ? 'confirmed' : score >= 0.4 ? 'probable' : 'candidate',
        creators: hub.creators.map(c => c.creator),
      };
    });

  // Output
  const output = {
    generated_at: new Date().toISOString(),
    creators_analyzed: profiles.length,
    hubs_found: hubs.length,
    cluster_candidates: clusters.length,
    hub_ranking: hubs.map(h => ({
      hub_wallet: h.hub_wallet,
      creator_count: h.creator_count,
      first_seen: h.first_seen,
      last_seen: h.last_seen,
    })),
    clusters,
    creator_profiles: profiles,
  };

  const outPath = './data/hubs_' + new Date().toISOString().split('T')[0] + '.json';
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.error(`\nSaved to ${outPath}`);

  console.log('\n=== HUB RANKING ===');
  for (const h of hubs) {
    const flag = h.creator_count >= 3 ? '🔴' : '🟡';
    console.log(`${flag} ${h.hub_wallet.slice(0,16)}... creators:${h.creator_count} span:${h.first_seen}→${h.last_seen}`);
  }
  console.log(`\nClusters confirmed: ${clusters.filter(c=>c.status==='confirmed').length}`);
  console.log(`Clusters probable:  ${clusters.filter(c=>c.status==='probable').length}`);
  console.log(`Clusters candidate: ${clusters.filter(c=>c.status==='candidate').length}`);
}

main().catch(e => console.error(e.message));
