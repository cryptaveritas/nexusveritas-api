const { Client } = require('pg');
require('dotenv').config();

const { toV } = require('../../lib/vector');
const { cos, centroid } = require('../../lib/math');


(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();
  const {rows}=await c.query("SELECT archetype,behavior FROM creators");await c.end();

  const groups={};
  for(const r of rows){(groups[r.archetype]=groups[r.archetype]||[]).push(toV(r.behavior));}

  const archetypes=Object.keys(groups);
  const centroids={};
  for(const a of archetypes) centroids[a]=centroid(groups[a]);

  // Print cross-archetype centroid similarity matrix
  console.log('Cross-archetype centroid cosine similarity:\n');
  const header = '  '.padEnd(22) + archetypes.map(a=>a.slice(0,8).padStart(9)).join('');
  console.log(header);
  for(const a of archetypes){
    let row = a.padEnd(22);
    for(const b of archetypes){
      row += cos(centroids[a],centroids[b]).toFixed(3).padStart(9);
    }
    console.log(row);
  }

  // Also: average cross-archetype best-match (excluding same archetype)
  console.log('\nFor each item, is its best match WITHIN its own archetype or CROSS?');
  let withinCount=0, crossCount=0;
  for(let i=0;i<rows.length;i++){
    let best=-1, bestArch=null;
    const vi = toV(rows[i].behavior);
    for(let j=0;j<rows.length;j++){
      if(i===j) continue;
      const sim=cos(vi, toV(rows[j].behavior));
      if(sim>best){best=sim; bestArch=rows[j].archetype;}
    }
    if(bestArch===rows[i].archetype) withinCount++; else crossCount++;
  }
  console.log(`best-match WITHIN same archetype: ${withinCount}/${rows.length} (${(100*withinCount/rows.length).toFixed(1)}%)`);
  console.log(`best-match CROSS archetype:       ${crossCount}/${rows.length} (${(100*crossCount/rows.length).toFixed(1)}%)`);
})();

// --- Test: replace [23] manySrc with log-scaled funding_sources_count ---
console.log('\n--- WITH [23] log-scaled funding_sources_count ---');
(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();
  const {rows}=await c.query("SELECT archetype,behavior FROM creators");await c.end();

  function toV2(bp){
    const v = toV(bp);
    v[23] = Math.min(Math.log1p(bp.structural.funding_sources_count)/Math.log1p(50), 1.0);
    return v;
  }

  const groups={};
  for(const r of rows){(groups[r.archetype]=groups[r.archetype]||[]).push(toV2(r.behavior));}
  const cI=centroid(groups['INFRASTRUCTURE_HUB']), cE=centroid(groups['EXCHANGE_FUNDED_DEPLOYER']);
  console.log('INFRASTRUCTURE_HUB <-> EXCHANGE_FUNDED_DEPLOYER centroid sim:', cos(cI,cE).toFixed(4));
})();
