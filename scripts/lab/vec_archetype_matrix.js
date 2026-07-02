const { Client } = require('pg');
require('dotenv').config();

function toV(bp){const s=bp.structural,b=bp.behavioral,o=bp.operational;
  const sigDensity=o.total_signatures/Math.max(o.days_active,1);
  const initProx=b.avg_transfer_sol>0?Math.max(0,1-Math.abs(b.avg_transfer_sol-0.002)/0.002):0;
  const burst=o.total_signatures/Math.max(o.days_active,1);
  return [Math.min(s.funding_sources_count/10,1),s.funding_concentration,1/(1+b.avg_transfer_sol),
  b.split_init_pattern?1:0,s.funding_sources_count===0?1:0,Math.min(sigDensity/100,1),b.recycling_loop?1:0,
  1/(1+s.wallet_age_days/30),sigDensity>50?1:sigDensity/50,o.total_signatures<=20?1:0,
  Math.min(Math.log1p(burst)/Math.log1p(3000),1),o.tokens_created<=2?1:0,
  Math.min(Math.log1p(o.days_active)/Math.log1p(365),1),Math.min(o.launch_frequency/10,1),
  (o.tokens_created<=2&&o.total_signatures<=15)?1:0,Math.min(Math.max(initProx,0),1),
  b.total_incoming_sol<=0.005?1:0,(s.wallet_age_days<=1&&o.tokens_created>=100)?1:0,
  (b.recycling_loop?0.5:0)+(b.split_init_pattern?0.5:0),Math.max(0,1-s.wallet_age_days/30),
  (s.funding_sources_count>=1&&b.total_incoming_sol>=0.5)?1:0,s.funding_concentration>=0.9?1:s.funding_concentration,
  Math.min(s.wallet_age_days/30,1),Math.min(s.funding_sources_count/5,1),Math.min(b.total_incoming_sol/100,1)];}

function cos(a,b){let d=0,na=0,nb=0;for(let i=0;i<a.length;i++){d+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}return na&&nb?d/(Math.sqrt(na)*Math.sqrt(nb)):0;}

function centroid(vecs){
  const dim=vecs[0].length, c=new Array(dim).fill(0);
  for(const v of vecs) for(let i=0;i<dim;i++) c[i]+=v[i];
  for(let i=0;i<dim;i++) c[i]/=vecs.length;
  return c;
}

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
  function centroid(vecs){const dim=vecs[0].length,c=new Array(dim).fill(0);for(const v of vecs)for(let i=0;i<dim;i++)c[i]+=v[i];for(let i=0;i<dim;i++)c[i]/=vecs.length;return c;}
  const cI=centroid(groups['INFRASTRUCTURE_HUB']), cE=centroid(groups['EXCHANGE_FUNDED_DEPLOYER']);
  console.log('INFRASTRUCTURE_HUB <-> EXCHANGE_FUNDED_DEPLOYER centroid sim:', cos(cI,cE).toFixed(4));
})();
