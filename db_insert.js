const { Client } = require('pg');
const readline = require('readline');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

function toVector(bp) {
  const s = bp.structural;
  const b = bp.behavioral;
  const o = bp.operational;
  const tokNorm = Math.min(o.tokens_created / 1000, 1.0);
  return [
    s.wallet_age_days,
    s.funding_sources_count,
    s.funding_concentration,
    b.transfer_count,
    Math.min(b.total_incoming_sol, 100),
    tokNorm,
    Math.min(o.days_active, 365),
  ];
}

async function main() {
  await client.connect();
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    try {
      const r = JSON.parse(line.trim());
      const vec = toVector(r.behavior_profile);
      const bp = r.behavior_profile;
      await client.query(`
        INSERT INTO creators
          (address, first_seen, archetype, confidence, behavior, vector,
           tokens_created, days_active, total_signatures, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6::vector,$7,$8,$9,NOW())
        ON CONFLICT (address) DO UPDATE SET
          archetype=EXCLUDED.archetype,
          confidence=EXCLUDED.confidence,
          behavior=EXCLUDED.behavior,
          vector=EXCLUDED.vector,
          updated_at=NOW()`,
        [
          r.creator,
          bp.structural.first_seen,
          r.operator_class,
          r.confidence,
          JSON.stringify(bp),
          '[' + vec.join(',') + ']',
          bp.operational.tokens_created,
          bp.operational.days_active,
          bp.operational.total_signatures,
        ]
      );
      console.error('inserted: ' + r.creator.slice(0,8) + '... ' + r.operator_class);
    } catch(e) { console.error('error:', e.message); }
  }
  await client.end();
}

main().catch(e => console.error(e.message));