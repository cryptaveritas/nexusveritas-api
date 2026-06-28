const fs = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');
const { Client } = require('pg');
require('dotenv').config();

const CSV = process.argv[2] || './pump_deployers.csv';
if (!fs.existsSync(CSV)) { console.error('CSV not found:', CSV); process.exit(1); }

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  process.stderr.write('Loading existing addresses from DB...\n');
  const res = await client.query('SELECT address FROM creators');
  const existing = new Set(res.rows.map(r => r.address.trim()));
  await client.end();
  process.stderr.write(`Existing: ${existing.size} operators\n`);

  const classify = spawn('node', ['operator_classify.js'], { stdio: ['pipe','pipe','inherit'] });
  const insert = spawn('node', ['db_insert.js'], { stdio: ['pipe','pipe','inherit'] });
  classify.stdout.pipe(insert.stdin);

  let processed = 0, skipped = 0, duplicates = 0;
  const rl = readline.createInterface({ input: fs.createReadStream(CSV) });
  let header = true;

  rl.on('line', line => {
    if (header) { header = false; return; }
    const parts = line.split(',');
    if (parts.length < 4) { skipped++; return; }
    const deployer = parts[0].trim();
    if (existing.has(deployer)) { duplicates++; return; }
    const tokens_created = parseInt(parts[1]) || 0;
    const first_seen = parts[2];
    const last_seen = parts[3];
    const d1 = new Date(first_seen);
    const d2 = new Date(last_seen);
    const days_active = Math.max(0, Math.round((d2 - d1) / 86400000));
    const total_signatures = tokens_created * 4;
    const behavior_profile = {
      // DECISION_009: null = UNKNOWN (we have no data from Dune backfill)
      // false/0 would mean "we checked and it's absent" -- wrong for synthetic data
      structural: { wallet_age_days: days_active, funding_sources_count: null, funding_concentration: null, first_seen: first_seen || null, last_seen: last_seen || null, top_funder: null },
      behavioral: { transfer_count: null, avg_transfer_sol: null, total_incoming_sol: null, recycling_loop: null, split_init_pattern: null },
      operational: { tokens_created, days_active, total_signatures, launch_frequency: days_active > 0 ? tokens_created / days_active : 0 }
    };
    classify.stdin.write(JSON.stringify({ mint: null, liq_usd: 0, creator: deployer, behavior_profile }) + '\n');
    processed++;
    if (processed % 1000 === 0) process.stderr.write(`New: ${processed} | Skipped duplicates: ${duplicates}\r`);
  });

  rl.on('close', () => {
    classify.stdin.end();
    process.stderr.write(`\nDone! New: ${processed} | Duplicates: ${duplicates} | Skipped: ${skipped}\n`);
  });
}
main().catch(console.error);
