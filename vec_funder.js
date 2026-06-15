const { Client } = require('pg');
require('dotenv').config();

function toV(bp){const s=bp.structural,b=bp.behavioral,o=bp.operational;
  const initProx=b.avg_transfer_sol>0?Math.max(0,1-Math.abs(b.avg_transfer_sol-0.002)/0.002):0;
  const burst=o.total_signatures/Math.max(o.days_active,1);
  return [Math.min(s.funding_sources_count/10,1),s.funding_concentration,1/(1+b.avg_transfer_sol),
  b.split_init_pattern?1:0,s.funding_sources_count===0?1:0,
  Math.min((o.total_signatures/Math.max(o.days_active,1))/100,1),b.recycling_loop?1:0,
  1/(1+s.wallet_age_days/30),
  (o.total_signatures/Math.max(o.days_active,1))>50?1:(o.total_signatures/Math.max(o.days_active,1))/50,
  o.total_signatures<=20?1:0,
  Math.min(Math.log1p(burst)/Math.log1p(3000),1),o.tokens_created<=2?1:0,
  Math.min(Math.log1p(o.days_active)/Math.log1p(365),1),Math.min(o.launch_frequency/10,1),
  (o.tokens_created<=2&&o.total_signatures<=15)?1:0,Math.min(Math.max(initProx,0),1),
  b.total_incoming_sol<=0.005?1:0,(s.wallet_age_days<=1&&o.tokens_created>=100)?1:0,
  (b.recycling_loop?0.5:0)+(b.split_init_pattern?0.5:0),Math.max(0,1-s.wallet_age_days/30),
  (s.funding_sources_count>=1&&b.total_incoming_sol>=0.5)?1:0,s.funding_concentration>=0.9?1:s.funding_concentration,
  Math.min(s.wallet_age_days/30,1),Math.min(s.funding_sources_count/5,1),Math.min(b.total_incoming_sol/100,1)];}

function cos(a,b){let d=0,na=0,nb=0;for(let i=0;i<a.length;i++){d+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}return na&&nb?d/(Math.sqrt(na)*Math.sqrt(nb)):0;}

(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();
  const {rows}=await c.query("SELECT address,behavior FROM creators ");await c.end();

  // funder_degree map
  const fcount=new Map();
  for(const r of rows){
    const tf=r.behavior.structural?.top_funder;
    if(tf) fcount.set(tf,(fcount.get(tf)||0)+1);
  }
  const degrees=rows.map(r=>{
    const tf=r.behavior.structural?.top_funder;
    return tf?(fcount.get(tf)||1):0;
  });
  const sorted=[...degrees].sort((a,b)=>a-b);
  const pct=p=>sorted[Math.floor(p*(sorted.length-1))];
  console.log('funder_degree: p25='+pct(0.25)+' p50='+pct(0.5)+' p75='+pct(0.75)+' p95='+pct(0.95)+' max='+sorted[sorted.length-1]);
  console.log('null top_funder count:', degrees.filter(d=>d===0).length, '/', degrees.length);

  // baseline P50 (without funder feature) for reference
  const vecs=rows.map(r=>toV(r.behavior));
  const best=[];
  for(let i=0;i<vecs.length;i++){let m=-1;for(let j=0;j<vecs.length;j++){if(i!==j){const s=cos(vecs[i],vecs[j]);if(s>m)m=s;}}best.push(m);}
  best.sort((a,b)=>a-b);
  const p=p=>best[Math.floor(p*(best.length-1))];
  console.log('BASELINE P25='+p(0.25).toFixed(4)+' P50='+p(0.5).toFixed(4)+' dupes='+best.filter(x=>x>=0.999).length);

  // WITH funder_degree feature replacing [9] (minimal activity, sparse flag)
  const maxDeg=Math.max(...degrees,1);
  const vecs2=rows.map((r,i)=>{
    const v=[...vecs[i]];
    v[9]=Math.min(Math.log1p(degrees[i])/Math.log1p(maxDeg),1.0); // replace [9]
    return v;
  });
  const best2=[];
  for(let i=0;i<vecs2.length;i++){let m=-1;for(let j=0;j<vecs2.length;j++){if(i!==j){const s=cos(vecs2[i],vecs2[j]);if(s>m)m=s;}}best2.push(m);}
  best2.sort((a,b)=>a-b);
  console.log('WITH funder_degree[9] P25='+p2(0.25).toFixed(4)+' P50='+p2(0.5).toFixed(4)+' dupes='+best2.filter(x=>x>=0.999).length);
  function p2(pp){return best2[Math.floor(pp*(best2.length-1))];}
})();
