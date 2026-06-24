const fs = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');

const CSV = process.argv[2] || './pump_deployers.csv';

if (!fs.existsSync(CSV)) {
  console.error('CSV not found:', CSV);
  process.exit(1);
}

const classify = spawn('node', ['operator_classify.js'], { stdio: ['pipe','pipe','inherit'] });
const insert = spawn('node', ['db_insert.js'], { stdio: ['pipe','pipe','inherit'] });

classify.stdout.pipe(insert.stdin);

let processed = 0;
let skipped = 0;

const rl = readline.createInterface({ input: fs.createReadStream(CSV) });
let header = true;

rl.on('line', line => {
  if (header) { header = false; return; }
  const parts = line.split(',');
  if (parts.length < 4) { skipped++; return; }

  const [deployer, tokens_created, first_seen, last_seen] = parts;
  const tc = parseInt(tokens_created) || 0;

  // Calculate days_active from first_seen and last_seen
  const d1 = new Date(first_seen);
  const d2 = new Date(last_seen);
  const days_active = Math.max(0, Math.round((d2 - d1) / 86400000));

  // Estimate total_signatures based on tokens_created
  const total_signatures = tc * 4;

  // Build behavior_profile matching enrich_parallel.js format
  const behavior_profile = {
    structural: {
      wallet_age_days: days_active,
      funding_sources_count: 0,
      funding_concentration: 0,
      first_seen: first_seen || null,
      top_funder: null
    },
    behavioral: {
      transfer_count: 0,
      avg_transfer_sol: 0,
      total_incoming_sol: 0,
      recycling_loop: false,
      split_init_pattern: false
    },
    operational: {
      tokens_created: tc,
      days_active: days_active,
      total_signatures: total_signatures,
      launch_frequency: days_active > 0 ? tc / days_active : 0
    }
  };

  const record = JSON.stringify({
    mint: null,
    liq_usd: 0,
    creator: deployer.trim(),
    behavior_profile
  });

  classify.stdin.write(record + '\n');
  processed++;

  if (processed % 1000 === 0) {
    process.stderr.write(`Processed: ${processed} operators...\n`);
  }
});

rl.on('close', () => {
  classify.stdin.end();
  process.stderr.write(`\nDone! Processed: ${processed}, Skipped: ${skipped}\n`);
});

insert.stdout.on('data', d => process.stdout.write(d));
