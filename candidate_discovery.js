
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Step 1: Find all cross-archetype high similarity pairs
  const pairs = await client.query(`
    SELECT
      a.address AS addr_a, a.archetype AS arch_a, a.tokens_created AS tok_a,
      b.address AS addr_b, b.archetype AS arch_b, b.tokens_created AS tok_b,
      1 - (a.vector_v2 <=> b.vector_v2) AS similarity
    FROM creators a
    JOIN creators b ON a.address < b.address
    WHERE a.vector_v2 IS NOT NULL AND b.vector_v2 IS NOT NULL
      AND 1 - (a.vector_v2 <=> b.vector_v2) > 0.50
    ORDER BY similarity DESC
    LIMIT 100
  `);

  // Step 2: Score each pair
  const scored = pairs.rows.map(r => {
    const sim = parseFloat(r.similarity);
    const crossArchetype = r.arch_a !== r.arch_b ? 1 : 0;
    const rarity = crossArchetype ? 1.5 : 1.0;
    const crossBonus = crossArchetype ? 1.3 : 1.0;
    const score = Math.round(sim * rarity * crossBonus * 1000) / 1000;
    return { ...r, similarity: Math.round(sim * 1000) / 1000, score, cross_archetype: crossArchetype === 1 };
  });

  scored.sort((a, b) => b.score - a.score);

  // Step 3: Insert into candidate_matches
  let inserted = 0;
  for (const p of scored) {
    const exists = await client.query(
      'SELECT 1 FROM candidate_matches WHERE operator_a=$1 AND operator_b=$2',
      [p.addr_a, p.addr_b]
    );
    if (exists.rows.length === 0) {
      await client.query(
        'INSERT INTO candidate_matches (operator_a, operator_b, similarity, matched_signals, status) VALUES ($1,$2,$3,$4,$5)',
        [p.addr_a, p.addr_b, p.similarity, [p.cross_archetype ? 'cross_archetype' : 'same_archetype', 'v2_similarity'], 'pending']
      );
      inserted++;
    }
  }

  // Step 4: Report
  console.log('\n=== CANDIDATE DISCOVERY ===');
  console.log('Total pairs found:', scored.length);
  console.log('New candidates inserted:', inserted);
  console.log('');
  console.log('TOP 20 BY SCORE:');
  console.log('─'.repeat(90));

  for (const p of scored.slice(0, 20)) {
    const flag = p.cross_archetype ? '🔴 CROSS' : '⚪ SAME ';
    console.log(
      flag,
      p.similarity.toFixed(3),
      'score:' + p.score.toFixed(3),
      p.addr_a.slice(0,10) + '..',
      p.arch_a.slice(0,10).padEnd(10),
      '↔',
      p.addr_b.slice(0,10) + '..',
      p.arch_b.slice(0,10)
    );
  }

  const crossPairs = scored.filter(p => p.cross_archetype);
  if (crossPairs.length > 0) {
    console.log('\n🔴 UNEXPECTED MATCHES (cross-archetype):');
    console.log('─'.repeat(90));
    for (const p of crossPairs) {
      console.log(
        'sim:' + p.similarity.toFixed(3),
        'score:' + p.score.toFixed(3),
        p.addr_a.slice(0,12) + '..', '(' + p.arch_a + ')',
        '↔',
        p.addr_b.slice(0,12) + '..', '(' + p.arch_b + ')'
      );
    }
  } else {
    console.log('\nNo cross-archetype matches found yet — need more data.');
  }

  await client.end();
}

main().catch(e => console.error(e.message));
