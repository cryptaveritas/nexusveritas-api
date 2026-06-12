const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');
require('dotenv').config();

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = new HttpsProxyAgent(PROXY);
const HELIUS_KEY = process.env.HELIUS_API_KEY;

const knownServices = JSON.parse(fs.readFileSync('./data/knownServices.json', 'utf8'));
const KNOWN_SET = new Set(knownServices.addresses.map(a => a.toLowerCase()));

const address = process.argv[2];
if (!address) { console.error('Usage: node funding_graph.js <creator_address>'); process.exit(1); }

async function getTransfers(addr, cursor) {
  let url = `https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${HELIUS_KEY}&limit=100&type=TRANSFER`;
  if (cursor) url += `&before=${cursor}`;
  const res = await fetch(url, { agent });
  return await res.json();
}

async function main() {
  console.error(`Building funding graph for: ${address}`);

  // Collect all incoming SOL transfers
  const incomingMap = new Map(); // wallet → { count, sol_received, first_seen, last_seen }
  let cursor;
  let page = 0;

  while (page < 5) { // max 500 txs
    const txs = await getTransfers(address, cursor);
    if (!Array.isArray(txs) || txs.length === 0) break;
    console.error(`  page ${page + 1}: ${txs.length} txs`);

    for (const tx of txs) {
      for (const t of tx.nativeTransfers || []) {
        if (t.toUserAccount !== address) continue;
        if (t.amount < 1000000) continue; // ignore dust < 0.001 SOL
        const from = t.fromUserAccount;
        if (!from || KNOWN_SET.has(from.toLowerCase())) continue;

        const entry = incomingMap.get(from) ?? { count: 0, sol_received: 0, first_seen: null, last_seen: null };
        entry.count++;
        entry.sol_received += t.amount / 1e9;
        const ts = tx.timestamp ? new Date(tx.timestamp * 1000).toISOString().split('T')[0] : null;
        if (ts) {
          if (!entry.first_seen || ts < entry.first_seen) entry.first_seen = ts;
          if (!entry.last_seen  || ts > entry.last_seen)  entry.last_seen  = ts;
        }
        incomingMap.set(from, entry);
      }
    }

    if (txs.length < 100) break;
    cursor = txs[txs.length - 1].signature;
    page++;
  }

  // Sort by sol_received desc
  const funding_sources = [...incomingMap.entries()]
    .map(([wallet, data]) => ({ wallet, ...data, sol_received: Math.round(data.sol_received * 1000) / 1000 }))
    .sort((a, b) => b.sol_received - a.sol_received);

  const total_sol = funding_sources.reduce((s, f) => s + f.sol_received, 0);
  const top_funder = funding_sources[0] ?? null;
  const funding_concentration = top_funder && total_sol > 0
    ? Math.round((top_funder.sol_received / total_sol) * 100) / 100
    : 0;

  console.log(JSON.stringify({
    creator: address,
    total_incoming_sol: Math.round(total_sol * 1000) / 1000,
    funding_concentration,
    top_funder: top_funder?.wallet ?? null,
    funding_sources,
  }, null, 2));
}

main().catch(e => console.error(e.message));
