const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');
require('dotenv').config();

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = new HttpsProxyAgent(PROXY);
const HELIUS_KEY = process.env.HELIUS_API_KEY;
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;

const knownServices = JSON.parse(fs.readFileSync('./data/knownServices.json', 'utf8'));
const KNOWN_SET = new Set(knownServices.addresses.map(a => a.toLowerCase()));

const creators = process.argv.slice(2);
if (creators.length === 0) {
  console.error('Usage: node find_clusters.js <creator1> <creator2> ...');
  process.exit(1);
}

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

async function getCreatorProfile(creatorAddress) {
  try {
    const sigs = await rpc('getSignaturesForAddress', [creatorAddress, { limit: 1000 }]);
    if (!sigs || sigs.length === 0) return null;

    const oldest = sigs[sigs.length - 1];
    const newest = sigs[0];

    const first_seen = oldest.blockTime ? new Date(oldest.blockTime * 1000).toISOString().split('T')[0] : null;
    const last_seen  = newest.blockTime ? new Date(newest.blockTime  * 1000).toISOString().split('T')[0] : null;
    const days_active = (oldest.blockTime && newest.blockTime)
      ? Math.round((newest.blockTime - oldest.blockTime) / 86400) : 0;

    // Funding wallet from oldest tx
    const tx = await rpc('getTransaction', [oldest.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
    if (!tx?.transaction?.message?.accountKeys) return null;

    const firstKey = tx.transaction.message.accountKeys[0];
    const funder = typeof firstKey === 'string' ? firstKey : firstKey?.pubkey ?? null;
    const funding_wallet = (funder && !KNOWN_SET.has(funder.toLowerCase())) ? funder : null;
    const funding_tx = oldest.signature;
    const funding_timestamp = first_seen;

    return {
      creator: creatorAddress,
      first_seen,
      last_seen,
      days_active,
      total_signatures: sigs.length,
      funding_wallet,
      funding_tx,
      funding_timestamp,
    };
  } catch { return null; }
}

async function main() {
  console.error(`Profiling ${creators.length} creators...`);

  const profiles = [];
  for (const creator of creators) {
    const profile = await getCreatorProfile(creator);
    if (profile) {
      profiles.push(profile);
      console.error(`  ${creator.slice(0,8)}... first_seen:${profile.first_seen} funder:${profile.funding_wallet?.slice(0,8) ?? 'unknown'}...`);
    }
  }

  // Group by funding_wallet → cluster candidates
  const funderMap = new Map();
  for (const p of profiles) {
    if (!p.funding_wallet) continue;
    const group = funderMap.get(p.funding_wallet) ?? [];
    group.push(p);
    funderMap.set(p.funding_wallet, group);
  }

  const clusters = [];
  let id = 1;
  for (const [funder, members] of funderMap.entries()) {
    if (members.length < 2) continue;

    // Temporal proximity: days between first and last launch in cluster
    const timestamps = members.map(m => m.first_seen).filter(Boolean).sort();
    const span_days = timestamps.length >= 2
      ? Math.round((new Date(timestamps[timestamps.length-1]) - new Date(timestamps[0])) / 86400000)
      : null;

    // Confidence score: base 0.25 per member, +0.1 if launches within 30 days
    let confidence = Math.min(0.25 * members.length, 0.75);
    if (span_days !== null && span_days <= 30) confidence = Math.min(confidence + 0.1, 0.85);

    clusters.push({
      cluster_id: `CLUSTER_${String(id).padStart(3, '0')}`,
      signal_type: 'funding_overlap',
      funding_wallet: funder,
      creator_count: members.length,
      creators: members.map(m => ({
        address: m.creator,
        first_seen: m.first_seen,
        last_seen: m.last_seen,
        days_active: m.days_active,
        funding_tx: m.funding_tx,
      })),
      launch_span_days: span_days,
      confidence_score: Math.round(confidence * 100) / 100,
      signals: ['funding_overlap'],
      status: 'candidate',
    });
    id++;
  }

  const output = {
    generated_at: new Date().toISOString(),
    creators_analyzed: profiles.length,
    clusters_found: clusters.length,
    clusters,
    unlinked_creators: profiles
      .filter(p => !p.funding_wallet || !clusters.some(c => c.funding_wallet === p.funding_wallet))
      .map(p => ({ creator: p.creator, first_seen: p.first_seen, days_active: p.days_active, funding_wallet: p.funding_wallet })),
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch(e => console.error(e.message));
