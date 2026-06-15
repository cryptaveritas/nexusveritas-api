const fs = require('fs'), path = require('path');
const f = path.join(process.env.HOME, 'Desktop/nexusveritas-api/operator_classify.js');
let c = fs.readFileSync(f, 'utf8');

// Add knownServices load at top
if (!c.includes('knownServices')) {
  c = c.replace(
    "require('dotenv').config();",
    "require('dotenv').config();\nconst _ks = JSON.parse(require('fs').readFileSync('./data/knownServices.json','utf8'));\nconst _knownSet = new Set(_ks.addresses.map(a => a.address.toLowerCase()));"
  );
}

// Add exchange check to INFRASTRUCTURE_HUB rules
c = c.replace(
  "{ signal: 'high_incoming_sol',          check: p => p.behavioral.total_incoming_sol >= 50,               weight: 0.40 },",
  "{ signal: 'high_incoming_sol',          check: p => p.behavioral.total_incoming_sol >= 50,               weight: 0.40 },\n      { signal: 'not_exchange_funded',       check: (p, meta) => !meta || !_knownSet.has((meta.top_funder||'').toLowerCase()), weight: 0.00 },"
);

fs.writeFileSync(f, c);
console.log('done');
