// Offline vector lab: reads behavior from DB, recomputes toV2 candidates,
// measures P50 nearest-neighbor -- no RPC. For fast weight/feature iteration.
const { Client } = require('pg');
require('dotenv').config();

// ---- CANDIDATE VECTOR: edit here, run, check P50 ----
const { toV2 } = require('../../lib/vector');
const { cos } = require('../../lib/math');
const FLAG_W = 0.4;
return na&&nb?d/(Math.sqrt(na)*Math.sqrt(nb)):0;}

(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL});
  await c.connect();
  const {rows}=await c.query("SELECT address,behavior FROM creators ");
  await c.end();
  const vecs=rows.map(r=>toV2(r.behavior, { flagWeight: FLAG_W }));
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
