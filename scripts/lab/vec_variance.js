const { Client } = require('pg');
require('dotenv').config();

const { toV, V2_DIMS: NAMES } = require('../../lib/vector');


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
