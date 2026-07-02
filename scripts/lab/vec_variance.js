const { Client } = require('pg');
require('dotenv').config();

function toV(bp) {
  const s = bp.structural, b = bp.behavioral, o = bp.operational;
  const sigDensity = o.total_signatures / Math.max(o.days_active, 1);
  const initProx = b.avg_transfer_sol > 0 ? Math.max(0, 1 - Math.abs(b.avg_transfer_sol - 0.002)/0.002) : 0;
  const burst = o.total_signatures / Math.max(o.days_active, 1);
  return [
    Math.min(s.funding_sources_count/10,1.0),
    s.funding_concentration,
    1/(1+b.avg_transfer_sol),
    b.split_init_pattern?1:0,
    s.funding_sources_count===0?1:0,
    Math.min(sigDensity/100,1.0),
    b.recycling_loop?1:0,
    1/(1+s.wallet_age_days/30),
    sigDensity>50?1:sigDensity/50,
    o.total_signatures<=20?1:0,
    Math.min(Math.log1p(burst)/Math.log1p(3000),1.0),
    o.tokens_created<=2?1:0,
    Math.min(Math.log1p(o.days_active)/Math.log1p(365),1.0),
    Math.min(o.launch_frequency/10,1.0),
    (o.tokens_created<=2&&o.total_signatures<=15)?1:0,
    Math.min(Math.max(initProx,0),1.0),
    b.total_incoming_sol<=0.005?1:0,
    (s.wallet_age_days<=1&&o.tokens_created>=100)?1:0,
    (b.recycling_loop?0.5:0)+(b.split_init_pattern?0.5:0),
    Math.max(0,1-s.wallet_age_days/30),
    (s.funding_sources_count>=1&&b.total_incoming_sol>=0.5)?1:0,
    s.funding_concentration>=0.9?1:s.funding_concentration,
    Math.min(s.wallet_age_days/30,1.0),
    Math.min(s.funding_sources_count/5,1.0),
    Math.min(b.total_incoming_sol/100,1.0),
  ];
}
const NAMES=['sources','concentr','smallXfer','splitInit','invisFund','sigDens','recycle','recency','highFreq','minimal','burst[10]','singlePur','daysSpan[12]','launchFq','factory','initProx','microFund','walletRot','automation','freshInfra','extFunded','highConc','maturity','manySrc','largeCap'];

(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL});
  await c.connect();
  const {rows}=await c.query("SELECT behavior FROM creators WHERE vector_version='v2.1'");
  await c.end();
  const vecs=rows.map(r=>toV(r.behavior));
  const n=vecs.length, dim=vecs[0].length;
  console.log('component | mean | std | min | max');
  for(let k=0;k<dim;k++){
    const col=vecs.map(v=>v[k]);
    const mean=col.reduce((a,b)=>a+b,0)/n;
    const std=Math.sqrt(col.reduce((a,b)=>a+(b-mean)**2,0)/n);
    const mn=Math.min(...col), mx=Math.max(...col);
    const flag=std<0.05?' <-- ~CONST':'';
    console.log(`[${k}] ${NAMES[k].padEnd(13)} mean=${mean.toFixed(3)} std=${std.toFixed(3)} [${mn.toFixed(2)},${mx.toFixed(2)}]${flag}`);
  }
})();
