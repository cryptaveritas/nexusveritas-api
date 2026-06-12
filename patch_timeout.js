const fs = require('fs'), path = require('path');
const f = path.join(process.env.HOME, 'Desktop/nexusveritas-api/enrich_creators.js');
let c = fs.readFileSync(f, 'utf8');
c = c.replace(
  'const [funding, operational] = await Promise.all([\n      getFundingProfile(creator),\n      getOperationalSignals(creator),\n    ]);',
  'const [funding, operational] = await Promise.race([\n      Promise.all([getFundingProfile(creator), getOperationalSignals(creator)]),\n      new Promise((_,r) => setTimeout(() => r(new Error("timeout")), 20000))\n    ]).catch(e => { console.error("skip:" + creator.slice(0,8)); return [null, {tokens_created:0,days_active:0,total_signatures:0,launch_frequency:0}]; });'
);
fs.writeFileSync(f, c);
console.log('done');
