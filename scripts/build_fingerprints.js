const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows: clusters } = await client.query(
    `SELECT DISTINCT cluster_id FROM creators WHERE cluster_id IS NOT NULL ORDER BY cluster_id`
  );
  console.log(`Building fingerprints for ${clusters.length} clusters...`);

  for (const { cluster_id } of clusters) {
    const { rows: wallets } = await client.query(
      `SELECT address, archetype, tokens_created, days_active, data_source_quality,
              behavior->'structural'->>'top_funder' as funder,
              behavior->'structural'->>'first_seen' as first_seen,
              vector_v2::text as vec
       FROM creators WHERE cluster_id = $1 AND vector_v2 IS NOT NULL`,
      [cluster_id]
    );
    if (!wallets.length) continue;

    const funder = wallets[0].funder;
    const dates = wallets.map(w => w.first_seen).filter(Boolean).sort();
    const unique_days = new Set(dates.map(d => d.slice(0,10))).size;
    const confidence = unique_days === 1 ? 'HIGH' : unique_days <= 3 ? 'MEDIUM' : 'LOW';

    // Archetype distribution + dominant
    const arch_dist = {};
    for (const w of wallets) arch_dist[w.archetype] = (arch_dist[w.archetype] || 0) + 1;
    const dominant = Object.entries(arch_dist).sort((a,b) => b[1]-a[1])[0][0];

    // Weighted avg vector by signal_coverage
    const usable = wallets.filter(w => w.vec);
    const fingerprint_wallets = usable.length;

    let centroid = null, variance = 0, consistency = 0, coverage_avg = 0;

    if (usable.length > 0) {
      const vecs = usable.map(w => w.vec.replace('[','').replace(']','').split(',').map(Number));
      const qualityWeight = q => q === 'full' ? 1.0 : q === 'partial' ? 0.6 : 0.3;
      const weights = usable.map(w => qualityWeight(w.data_source_quality));
      const total_weight = weights.reduce((a,b) => a+b, 0);

      // Weighted centroid
      centroid = Array(25).fill(0);
      for (let i = 0; i < usable.length; i++) {
        for (let d = 0; d < 25; d++) {
          centroid[d] += vecs[i][d] * weights[i] / total_weight;
        }
      }

      // Variance (avg squared distance from centroid)
      let total_var = 0;
      for (const vec of vecs) {
        let sq_dist = 0;
        for (let d = 0; d < 25; d++) sq_dist += Math.pow(vec[d] - centroid[d], 2);
        total_var += Math.sqrt(sq_dist);
      }
      variance = total_var / vecs.length;
      consistency = Math.max(0, 1 - variance);
      coverage_avg = total_weight / usable.length; // weighted avg quality
    }

    const avg_tokens = wallets.reduce((a,w) => a + (w.tokens_created||0), 0) / wallets.length;
    const avg_days = wallets.reduce((a,w) => a + (w.days_active||0), 0) / wallets.length;
    const total_tokens = wallets.reduce((a,w) => a + (w.tokens_created||0), 0);

    // Fingerprint confidence
    const fp_confidence = centroid
      ? coverage_avg * consistency * Math.min(wallets.length / 5, 1)
      : 0;

    const centroid_str = centroid ? '[' + centroid.join(',') + ']' : null;

    await client.query(`
      INSERT INTO operator_profiles (
        operator_id, funder, wallet_count, fingerprint_wallets, unique_days,
        heuristic_confidence, dominant_archetype, archetype_distribution,
        behavior_consistency, fingerprint_centroid, fingerprint_variance,
        fingerprint_confidence, fingerprint_version, signal_coverage_avg,
        avg_tokens_created, avg_days_active, total_tokens_created,
        first_seen, last_seen, validation_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'v1',$13,$14,$15,$16,$17,$18,'pending')
      ON CONFLICT (operator_id) DO UPDATE SET
        funder=EXCLUDED.funder, wallet_count=EXCLUDED.wallet_count,
        fingerprint_wallets=EXCLUDED.fingerprint_wallets,
        heuristic_confidence=EXCLUDED.heuristic_confidence,
        dominant_archetype=EXCLUDED.dominant_archetype,
        archetype_distribution=EXCLUDED.archetype_distribution,
        behavior_consistency=EXCLUDED.behavior_consistency,
        fingerprint_centroid=EXCLUDED.fingerprint_centroid,
        fingerprint_variance=EXCLUDED.fingerprint_variance,
        fingerprint_confidence=EXCLUDED.fingerprint_confidence,
        signal_coverage_avg=EXCLUDED.signal_coverage_avg,
        updated_at=NOW()
    `, [
      cluster_id, funder, wallets.length, fingerprint_wallets, unique_days,
      confidence, dominant, JSON.stringify(arch_dist),
      consistency, centroid_str, variance,
      fp_confidence, coverage_avg,
      avg_tokens, avg_days, total_tokens,
      dates[0] || null, dates[dates.length-1] || null
    ]);

    console.log(`${cluster_id}: wallets=${wallets.length} usable=${fingerprint_wallets} consistency=${consistency.toFixed(2)} fp_confidence=${fp_confidence.toFixed(3)} dominant=${dominant}`);
  }

  // Self-similarity test
  console.log('\n--- Self-similarity test ---');
  const { rows: profiles } = await client.query(
    `SELECT operator_id, fingerprint_centroid::text as vec FROM operator_profiles WHERE fingerprint_centroid IS NOT NULL LIMIT 3`
  );
  for (const p of profiles) {
    const { rows: sim } = await client.query(
      `SELECT operator_id, 1 - (fingerprint_centroid <=> $1::vector) as similarity
       FROM operator_profiles WHERE fingerprint_centroid IS NOT NULL
       ORDER BY fingerprint_centroid <=> $1::vector LIMIT 3`,
      [p.vec]
    );
    console.log(`${p.operator_id} most similar: ${sim.map(s => `${s.operator_id}(${parseFloat(s.similarity).toFixed(3)})`).join(', ')}`);
  }

  await client.end();
}
main().catch(console.error);
