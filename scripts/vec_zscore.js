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
function euc(a,b){let s=0;for(let i=0;i<a.length;i++)s+=(a[i]-b[i])**2;return Math.sqrt(s);}

(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();
  const {rows}=await c.query("SELECT behavior FROM creators WHERE vector_version='v2.1'");await c.end();
  let vecs=rows.map(r=>toV(r.behavior));
  const n=vecs.length,dim=vecs[0].length;
  // z-score per component
  const mean=[],std=[];
  for(let k=0;k<dim;k++){const col=vecs.map(v=>v[k]);const m=col.reduce((a,b)=>a+b,0)/n;
    const sd=Math.sqrt(col.reduce((a,b)=>a+(b-m)**2,0)/n)||1;mean[k]=m;std[k]=sd;}
  const z=vecs.map(v=>v.map((x,k)=>(x-mean[k])/std[k]));

  function p50nn(V,metric){
    const best=[];
    for(let i=0;i<V.length;i++){let m=metric==='cos'?-1:Infinity;
      for(let j=0;j<V.length;j++){if(i!==j){const s=metric==='cos'?cos(V[i],V[j]):euc(V[i],V[j]);
        if(metric==='cos'){if(s>m)m=s;}else{if(s<m)m=s;}}}best.push(m);}
    best.sort((a,b)=>a-b);const pct=p=>best[Math.floor(p*(best.length-1))];
    return {p25:pct(0.25),p50:pct(0.5),p75:pct(0.75),min:best[0],max:best[best.length-1]};
  }

  const raw=p50nn(vecs,'cos');
  console.log(`RAW cosine:      P25=${raw.p25.toFixed(4)} P50=${raw.p50.toFixed(4)} P75=${raw.p75.toFixed(4)}`);
  const zc=p50nn(z,'cos');
  console.log(`Z-SCORE cosine:  P25=${zc.p25.toFixed(4)} P50=${zc.p50.toFixed(4)} P75=${zc.p75.toFixed(4)}`);
  const ze=p50nn(z,'euc');
  console.log(`Z-SCORE euclid:  P25=${ze.p25.toFixed(2)} P50=${ze.p50.toFixed(2)} P75=${ze.p75.toFixed(2)} (lower=better, not 0..1)`);
})();
