// Офлайн-лаборатория вектора: читает behavior из БД, пересчитывает toV2-кандидаты,
// мерит P50 nearest-neighbor — без RPC. Для быстрой итерации весов/фич.
const { Client } = require('pg');
require('dotenv').config();

// ---- КАНДИДАТ-ВЕКТОР: правим здесь, гоним, смотрим P50 ----
const FLAG_W = 0.4;   // вес бинарных флагов
function toV(bp) {
  const s = bp.structural, b = bp.behavioral, o = bp.operational;
  const sigDensity = o.total_signatures / Math.max(o.days_active, 1);
  const initProx = b.avg_transfer_sol > 0 ? Math.max(0, 1 - Math.abs(b.avg_transfer_sol - 0.002)/0.002) : 0;
  const burst = o.total_signatures / Math.max(o.days_active, 1);
  const F = FLAG_W;
  return [
    Math.min(s.funding_sources_count/10,1.0),               // [0]
    s.funding_concentration,                                 // [1]
    1/(1+b.avg_transfer_sol),                                // [2]
    (b.split_init_pattern?1:0)*F,                            // [3] flag
    (s.funding_sources_count===0?1:0)*F,                     // [4] flag
    Math.min(sigDensity/100,1.0),                            // [5]
    (b.recycling_loop?1:0)*F,                                // [6] flag
    1/(1+s.wallet_age_days/30),                              // [7]
    sigDensity>50?1:sigDensity/50,                           // [8]
    (o.total_signatures<=20?1:0)*F,                          // [9] flag
    Math.min(Math.log1p(burst)/Math.log1p(3000),1.0),        // [10] burstiness (NEW)
    (o.tokens_created<=2?1:0)*F,                             // [11] flag
    Math.min(Math.log1p(o.days_active)/Math.log1p(365),1.0), // [12] days_active span
    Math.min(o.launch_frequency/10,1.0),                     // [13]
    ((o.tokens_created<=2&&o.total_signatures<=15)?1:0)*F,   // [14] flag
    Math.min(Math.max(initProx,0),1.0),                      // [15]
    (b.total_incoming_sol<=0.005?1:0)*F,                     // [16] flag
    ((s.wallet_age_days<=1&&o.tokens_created>=100)?1:0)*F,   // [17] flag
    ((b.recycling_loop?0.5:0)+(b.split_init_pattern?0.5:0))*F, // [18] flag-ish
    Math.max(0,1-s.wallet_age_days/30),                      // [19]
    ((s.funding_sources_count>=1&&b.total_incoming_sol>=0.5)?1:0)*F, // [20] flag
    s.funding_concentration>=0.9?1:s.funding_concentration,  // [21]
    Math.min(s.wallet_age_days/30,1.0),                      // [22]
    Math.min(s.funding_sources_count/5,1.0),                 // [23]
    Math.min(b.total_incoming_sol/100,1.0),                  // [24]
  ];
}
// ----------------------------------------------------------

function cos(a,b){let d=0,na=0,nb=0;for(let i=0;i<a.length;i++){d+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}return na&&nb?d/(Math.sqrt(na)*Math.sqrt(nb)):0;}

(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL});
  await c.connect();
  const {rows}=await c.query("SELECT address,behavior FROM creators ");
  await c.end();
  const vecs=rows.map(r=>toV(r.behavior));
  const best=[];
  for(let i=0;i<vecs.length;i++){
    let m=-1;
    for(let j=0;j<vecs.length;j++){if(i!==j){const s=cos(vecs[i],vecs[j]);if(s>m)m=s;}}
    best.push(m);
  }
  best.sort((a,b)=>a-b);
  const pct=p=>best[Math.floor(p*(best.length-1))];
  const dupes=best.filter(x=>x>=0.999).length;
  console.log(`n=${best.length} FLAG_W=${FLAG_W}`);
  console.log(`P25=${pct(0.25).toFixed(4)} P50=${pct(0.5).toFixed(4)} P75=${pct(0.75).toFixed(4)} P95=${pct(0.95).toFixed(4)}`);
  console.log(`min=${best[0].toFixed(4)} dupes(>=0.999)=${dupes} (${(100*dupes/best.length).toFixed(1)}%)`);
})();
