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

function stats(vecs){
  const best=[];
  for(let i=0;i<vecs.length;i++){let m=-1;for(let j=0;j<vecs.length;j++){if(i!==j){const s=cos(vecs[i],vecs[j]);if(s>m)m=s;}}best.push(m);}
  best.sort((a,b)=>a-b);
  const p=p=>best[Math.floor(p*(best.length-1))];
  const dupes=best.filter(x=>x>=0.999).length;
  return {n:best.length,p25:p(0.25),p50:p(0.5),p95:p(0.95),min:best[0],dupes,pct:(100*dupes/best.length).toFixed(1)};
}

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
