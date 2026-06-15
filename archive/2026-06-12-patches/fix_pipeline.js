const fs = require('fs'), path = require('path');
const f = path.join(process.env.HOME, 'Desktop/nexusveritas-api/enrich_creators.js');
let c = fs.readFileSync(f, 'utf8');

// 1. Добавить timeout на каждый токен
c = c.replace(
  'async function getFundingProfile(addr) {',
  `async function withTimeout(promise, ms=15000) {
  return Promise.race([promise, new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);
}

async function getFundingProfile(addr) {`
);

// 2. Добавить счётчик прогресса
c = c.replace(
  'for await (const line of rl) {',
  `let _count = 0; let _start = Date.now();
  for await (const line of rl) {
    _count++;
    if (_count % 10 === 0) {
      const elapsed = Math.round((Date.now()-_start)/1000);
      console.error(\`Progress: \${_count} tokens processed in \${elapsed}s\`);
    }`
);

fs.writeFileSync(f, c);
console.log('done');
