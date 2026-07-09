const { Client } = require('pg');
require('dotenv').config();

const { toV } = require('../../lib/vector');
const { cos, stats } = require('../../lib/math');


(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();
  const {rows}=await c.query("SELECT archetype,behavior FROM creators");await c.end();

  const groups={};
  for(const r of rows){(groups[r.archetype]=groups[r.archetype]||[]).push(toV(r.behavior));}

  for(const [arch,vecs] of Object.entries(groups)){
    const s=stats(vecs);
    console.log(`${arch.padEnd(24)} n=${s.n.toString().padEnd(4)} P50=${s.p50.toFixed(4)} P95=${s.p95.toFixed(4)} dupes=${s.dupes}/${s.n} (${s.pct}%)`);
  }

  console.log('---');
  const nonIndustrial = rows.filter(r=>r.archetype!=='INDUSTRIAL_DEPLOYER').map(r=>toV(r.behavior));
  const s=stats(nonIndustrial);
  console.log(`ALL except INDUSTRIAL    n=${s.n.toString().padEnd(4)} P50=${s.p50.toFixed(4)} P95=${s.p95.toFixed(4)} dupes=${s.dupes}/${s.n} (${s.pct}%)`);
})();
