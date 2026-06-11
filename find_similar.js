
const { Client } = require('pg');
require('dotenv').config();

const targetAddress = process.argv[2];
const topN = parseInt(process.argv[3] ?? '5');
if (!targetAddress) { console.error('Usage: node find_similar.js <creator_address> [top_n]'); process.exit(1); }

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const target = await client.query('SELECT vector, archetype, confidence FROM creators WHERE address = $1', [targetAddress]);
  if (target.rows.length === 0) { console.error('Creator not found in DB:', targetAddress); process.exit(1); }

  const { vector, archetype, confidence } = target.rows[0];

  const similar = await client.query(`
    SELECT address, archetype, confidence, tokens_created, days_active,
           1 - (vector <=> $1::vector) AS similarity
    FROM creators
    WHERE address != $2
    ORDER BY vector <=> $1::vector
    LIMIT $3
  `, [vector, targetAddress, topN]);

  console.log('\n=== SIMILARITY SEARCH ===');
  console.log('Query:', targetAddress.slice(0,12)+'...', '|', archetype, '| conf:', confidence);
  console.log('─'.repeat(80));
  for (const r of similar.rows) {
    const sim = (r.similarity * 100).toFixed(1);
    const match = r.archetype === archetype ? '✓ SAME' : '≠ DIFF';
    console.log(`${sim}%  ${r.address.slice(0,16)}...  ${r.archetype.padEnd(20)} ${match}  tokens:${r.tokens_created}`);
  }
  console.log('─'.repeat(80));

  await client.end();
}

main().catch(e => console.error(e.message));
