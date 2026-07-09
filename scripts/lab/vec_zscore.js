const { Client } = require('pg');
require('dotenv').config();

const { toV } = require('../../lib/vector');
const { cos, euc } = require('../../lib/math');


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
