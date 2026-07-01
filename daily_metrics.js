const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const [creators, archetypes, candidates, simStats] = await Promise.all([
    client.query('SELECT COUNT(*) FROM creators'),
    client.query('SELECT archetype, COUNT(*) FROM creators GROUP BY archetype ORDER BY COUNT(*) DESC'),
    client.query(`SELECT
      COUNT(*) total,
      COUNT(*) FILTER (WHERE status='pending') pending,
      COUNT(*) FILTER (WHERE status='confirmed') confirmed,
      COUNT(*) FILTER (WHERE status='rejected') rejected,
      COUNT(*) FILTER (WHERE 'cross_archetype'=ANY(matched_signals)) cross_archetype
      FROM candidate_matches`),
    client.query(`SELECT
      ROUND(AVG(similarity)::numeric,3) avg_sim,
      ROUND(MIN(similarity)::numeric,3) min_sim,
      ROUND(MAX(similarity)::numeric,3) max_sim,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY similarity)::numeric,3) p50,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY similarity)::numeric,3) p90,
      ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY similarity)::numeric,3) p95
      FROM candidate_matches`),
  ]);

  const date = new Date().toISOString().split('T')[0];
  console.log('\n=== NexusVeritas Daily Metrics', date, '===\n');
  console.log('CREATORS:     ', creators.rows[0].count);
  archetypes.rows.forEach(r => console.log(' ', r.archetype.padEnd(22), r.count));

  console.log('\nCANDIDATES:');
  const c = candidates.rows[0];
  console.log('  Total:          ', c.total);
  console.log('  Pending:        ', c.pending);
  console.log('  Confirmed:      ', c.confirmed);
  console.log('  Cross-archetype:', c.cross_archetype);

  console.log('\nSIMILARITY DISTRIBUTION:');
  const s = simStats.rows[0];
  console.log('  Min:', s.min_sim, '  Avg:', s.avg_sim, '  Max:', s.max_sim);
  console.log('  P50:', s.p50, '  P90:', s.p90, '  P95:', s.p95);

  // Save to pipeline_runs
  await client.query(`
    INSERT INTO pipeline_runs (run_date, tokens_found, creators_analyzed, new_creators, clusters_found, candidate_matches)
    VALUES ($1, 0, $2, 0, 0, $3)
    ON CONFLICT DO NOTHING`,
    [date, creators.rows[0].count, c.total]
  );

  await client.end();
}
main().catch(e => console.error(e.message));
