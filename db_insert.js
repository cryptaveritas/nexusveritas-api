
const { Client } = require('pg');
const readline = require('readline');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

function toV1(bp) {
  const s = bp.structural, b = bp.behavioral, o = bp.operational;
  return [
    s.wallet_age_days,
    s.funding_sources_count,
    s.funding_concentration,
    b.transfer_count,
    Math.min(b.total_incoming_sol, 100),
    Math.min(o.tokens_created / 1000, 1.0),
    Math.min(o.days_active, 365),
  ];
}

function toV2(bp) {
  const s = bp.structural, b = bp.behavioral, o = bp.operational;
  const sigDensity = o.total_signatures / Math.max(o.days_active, 1);
  const tokPerSig  = o.tokens_created / Math.max(o.total_signatures, 1);
  const initProx   = b.avg_transfer_sol > 0
    ? Math.max(0, 1 - Math.abs(b.avg_transfer_sol - 0.002) / 0.002)
    : 0;

  return [
    // Funding Layer (5)
    Math.min(s.funding_sources_count / 10, 1.0),          // [0] sources count
    s.funding_concentration,                               // [1] concentration
    1 / (1 + b.avg_transfer_sol),                          // [2] small transfer score
    b.split_init_pattern ? 1 : 0,                          // [3] split init
    s.funding_sources_count === 0 ? 1 : 0,                 // [4] invisible funding

    // Activity Layer (5)
    Math.min(sigDensity / 100, 1.0),                       // [5] signature density
    b.recycling_loop ? 1 : 0,                              // [6] recycling loop
    1 / (1 + s.wallet_age_days / 30),                      // [7] recency score
    sigDensity > 50 ? 1 : sigDensity / 50,                 // [8] high frequency
    o.total_signatures <= 20 ? 1 : 0,                      // [9] minimal activity

    // Launch Layer (5)
    Math.min(tokPerSig, 1.0),                              // [10] tokens per sig
    o.tokens_created <= 2 ? 1 : 0,                        // [11] single purpose
    Math.min(o.tokens_created / 500, 1.0),                 // [12] mass deployer
    Math.min(o.launch_frequency / 10, 1.0),                // [13] launch frequency
    (o.tokens_created <= 2 && o.total_signatures <= 15) ? 1 : 0, // [14] factory pattern

    // Behavioral Layer (5)
    Math.min(Math.max(initProx, 0), 1.0),                  // [15] init amount proximity
    b.total_incoming_sol <= 0.005 ? 1 : 0,                 // [16] micro funding
    (s.wallet_age_days <= 1 && o.tokens_created >= 100) ? 1 : 0, // [17] wallet rotation
    (b.recycling_loop ? 0.5 : 0) + (b.split_init_pattern ? 0.5 : 0), // [18] automation score
    Math.max(0, 1 - s.wallet_age_days / 30),               // [19] fresh infrastructure

    // Structural Layer (5)
    (s.funding_sources_count >= 1 && b.total_incoming_sol >= 0.5) ? 1 : 0, // [20] externally funded
    s.funding_concentration >= 0.9 ? 1 : s.funding_concentration,          // [21] high concentration
    Math.min(s.wallet_age_days / 30, 1.0),                 // [22] wallet maturity
    Math.min(s.funding_sources_count / 5, 1.0),            // [23] many sources
    Math.min(b.total_incoming_sol / 100, 1.0),             // [24] large capital
  ];
}

async function main() {
  await client.connect();
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    try {
      const r = JSON.parse(line.trim());
      const bp = r.behavior_profile;
      const v1 = toV1(bp);
      const v2 = toV2(bp);
      await client.query(`
        INSERT INTO creators
          (address, first_seen, archetype, confidence, behavior,
           vector_v1, vector_v2,
           tokens_created, days_active, total_signatures, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6::vector,$7::vector,$8,$9,$10,NOW())
        ON CONFLICT (address) DO UPDATE SET
          archetype=EXCLUDED.archetype,
          confidence=EXCLUDED.confidence,
          behavior=EXCLUDED.behavior,
          vector_v1=EXCLUDED.vector_v1,
          vector_v2=EXCLUDED.vector_v2,
          updated_at=NOW(), vector_version='v2'`,
        [
          r.creator,
          bp.structural.first_seen,
          r.operator_class,
          r.confidence,
          JSON.stringify(bp),
          '[' + v1.join(',') + ']',
          '[' + v2.join(',') + ']',
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
