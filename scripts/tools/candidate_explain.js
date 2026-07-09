const { Client } = require('pg');
require('dotenv').config();

const FEATURE_NAMES = [
  'funding_sources_count','funding_concentration','small_transfer_score','split_init','invisible_funding',
  'signature_density','recycling_loop','recency_score','high_frequency','minimal_activity',
  'tokens_per_sig','single_purpose','mass_deployer','launch_frequency','factory_pattern',
  'init_amount_proximity','micro_funding','wallet_rotation','automation_score','fresh_infrastructure',
  'externally_funded','high_concentration','wallet_maturity','many_sources','large_capital'
];

function parseVector(v) { return v.replace(/[\[\]]/g,'').split(',').map(Number); }

function explain(vecA, vecB) {
  const c = FEATURE_NAMES.map((name,i) => ({name, agreement: 1 - Math.abs(vecA[i]-vecB[i])}));
  return {
    top_shared: [...c].sort((a,b)=>b.agreement-a.agreement).slice(0,5).map(f=>f.name),
    top_diverging: [...c].sort((a,b)=>a.agreement-b.agreement).slice(0,3).map(f=>f.name),
  };
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const rows = await client.query(`
    SELECT cm.similarity, a.archetype arch_a, a.vector_v2 vec_a, a.address addr_a,
           b.archetype arch_b, b.vector_v2 vec_b, b.address addr_b
    FROM candidate_matches cm
    JOIN creators a ON cm.operator_a=a.address
    JOIN creators b ON cm.operator_b=b.address
    WHERE cm.status='pending' AND a.archetype != b.archetype
    ORDER BY cm.similarity DESC LIMIT 10`);

  const INFRA = ['recycling_loop','split_init','factory_pattern','init_amount_proximity','micro_funding','automation_score'];
  const GENERIC = ['recency_score','wallet_maturity','minimal_activity','single_purpose'];

  console.log('\n=== CROSS-ARCHETYPE EXPLANATION ===\n');
  for (const r of rows.rows) {
    const ex = explain(parseVector(r.vec_a), parseVector(r.vec_b));
    const infra = ex.top_shared.filter(f => {
      const i = FEATURE_NAMES.indexOf(f);
      return INFRA.includes(f) && parseVector(r.vec_a)[i] > 0.3 && parseVector(r.vec_b)[i] > 0.3;
    }).length;
    const generic = ex.top_shared.filter(f=>GENERIC.includes(f)).length;
    const verdict = infra>=2 ? 'INFRASTRUCTURE_CANDIDATE' : infra===1 ? 'WEAK_INFRASTRUCTURE' : 'GENERIC_OVERLAP';
    console.log(`${r.arch_a} <-> ${r.arch_b}  sim:${r.similarity}`);
    console.log(`  Shared:    ${ex.top_shared.join(', ')}`);
    console.log(`  Diverging: ${ex.top_diverging.join(', ')}`);
    console.log(`  Verdict:   ${verdict} (infra:${infra} generic:${generic})\n`);
  }
  await client.end();
}
main().catch(e=>console.error(e.message));
