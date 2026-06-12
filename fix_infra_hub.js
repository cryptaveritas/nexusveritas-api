const fs = require('fs'), path = require('path');
const f = path.join(process.env.HOME, 'Desktop/nexusveritas-api/operator_classify.js');
let c = fs.readFileSync(f, 'utf8');

c = c.replace(
  "  const best = results[0] ?? { class: 'UNKNOWN', confidence: 0, baseline_risk: 'unknown', matched_signals: [] };",
  `  let best = results[0] ?? { class: 'UNKNOWN', confidence: 0, baseline_risk: 'unknown', matched_signals: [] };
  // FINDING_005 fix: reclassify INFRASTRUCTURE_HUB if pattern matches exchange funding
  if (best.class === 'INFRASTRUCTURE_HUB') {
    const sol = p.behavioral.total_incoming_sol;
    const sources = p.structural.funding_sources_count;
    const conc = p.structural.funding_concentration;
    const tokens = p.operational.tokens_created;
    // Exchange pattern: high SOL + multiple sources + high token count
    if (sol >= 100 && sources >= 3 && conc <= 0.8 && tokens >= 500) {
      best = { ...best, class: 'EXCHANGE_FUNDED_DEPLOYER', matched_signals: [...best.matched_signals, 'exchange_funding_pattern'] };
    }
  }`
);

fs.writeFileSync(f, c);
console.log('done');
