
const readline = require('readline');

// Three-value logic helpers (DECISION_009)
// NULL/undefined = UNKNOWN, not false
const isTrue = v => v === true;
const isFalse = v => v === false;
const isUnknown = v => v === null || v === undefined;


// Archetype definitions — signal rules + confidence weights
const ARCHETYPES = [
  {
    class: 'WALLET_FACTORY_HUB',
    baseline_risk: 'elevated',
    rules: [
      { signal: 'recycling_loop_true',        check: p => p.behavioral.recycling_loop,                         weight: 0.40 },
      { signal: 'init_amount_0002',           check: p => p.behavioral.total_incoming_sol <= 0.005 && p.behavioral.total_incoming_sol > 0, weight: 0.25 },
      { signal: 'single_purpose_wallet',      check: p => p.operational.tokens_created <= 2 && p.operational.total_signatures < 20, weight: 0.20 },
      { signal: 'fresh_wallet',               check: p => p.structural.wallet_age_days <= 1,                   weight: 0.15 },
    ],
    min_confidence: 0.40,
  },
  {
    class: 'WALLET_FACTORY',
    baseline_risk: 'elevated',
    rules: [
      { signal: 'single_token_wallet',        check: p => p.operational.tokens_created <= 2,                   weight: 0.35 },
      { signal: 'minimal_activity',           check: p => p.operational.total_signatures <= 15,                weight: 0.30 },
      { signal: 'fresh_wallet',               check: p => p.structural.wallet_age_days <= 1,                   weight: 0.20 },
      { signal: 'init_amount_0002',           check: p => p.behavioral.total_incoming_sol <= 0.005 && p.behavioral.total_incoming_sol > 0, weight: 0.10 },
      { signal: 'no_large_funding',           check: p => p.behavioral.total_incoming_sol < 1.0,               weight: 0.05 },
    ],
    min_confidence: 0.50,
  },
  {
    class: 'ROTATION_OPERATOR',
    baseline_risk: 'high',
    rules: [
      { signal: 'split_init_pattern',         check: p => p.behavioral.split_init_pattern,                     weight: 0.35 },
      { signal: 'fresh_wallet',               check: p => p.structural.wallet_age_days <= 1,                   weight: 0.25 },
      { signal: 'tokens_created_500_plus',    check: p => p.operational.tokens_created >= 500,                 weight: 0.25 },
      { signal: 'no_visible_funding',         check: p => p.structural.funding_sources_count === 0,            weight: 0.15 },
    ],
    min_confidence: 0.35,
  },
  {
    class: 'INDUSTRIAL_DEPLOYER',
    baseline_risk: 'neutral',
    rules: [
      { signal: 'tokens_created_500_plus',    check: p => p.operational.tokens_created >= 500,                 weight: 0.35 },
      { signal: 'signatures_3000_plus',       check: p => p.operational.total_signatures >= 3000,              weight: 0.30 },
      { signal: 'no_visible_funding',         check: p => p.structural.funding_sources_count === 0,            weight: 0.20 },
      { signal: 'no_recycling_loop',          check: p => !p.behavioral.recycling_loop,                        weight: 0.15 },
    ],
    min_confidence: 0.50,
  },
  {
    class: 'INFRASTRUCTURE_HUB',
    baseline_risk: 'unknown',
    rules: [
      { signal: 'high_incoming_sol',          check: p => p.behavioral.total_incoming_sol >= 50,               weight: 0.40 },
      { signal: 'not_exchange_funded',       check: (p, meta) => !meta || !_knownSet.has((meta.top_funder||'').toLowerCase()), weight: 0.00 },
      { signal: 'many_funding_sources',       check: p => p.structural.funding_sources_count >= 5,             weight: 0.35 },
      { signal: 'high_avg_transfer',          check: p => p.behavioral.avg_transfer_sol >= 5,                  weight: 0.25 },
    ],
    min_confidence: 0.40,
  },
  {
    class: 'EXCHANGE_FUNDED_DEPLOYER',
    baseline_risk: 'high',
    rules: [
      { signal: 'high_incoming_sol',          check: p => p.behavioral.total_incoming_sol >= 100,              weight: 0.35 },
      { signal: 'many_funding_sources',       check: p => p.structural.funding_sources_count >= 3,             weight: 0.25 },
      { signal: 'tokens_created_500_plus',    check: p => p.operational.tokens_created >= 500,                 weight: 0.25 },
      { signal: 'low_funding_concentration',  check: p => p.structural.funding_concentration <= 0.8,           weight: 0.15 },
    ],
    min_confidence: 0.60,
  },
  {
    class: 'PROFESSIONAL_CREATOR',
    baseline_risk: 'low_medium',
    rules: [
      { signal: 'tokens_20_plus',             check: p => p.operational.tokens_created >= 20,                  weight: 0.40 },
      { signal: 'visible_funding',            check: p => p.structural.funding_sources_count >= 1,             weight: 0.30 },
      { signal: 'days_active_30_plus',        check: p => p.structural.wallet_age_days >= 30,                  weight: 0.30 },
    ],
    // Requires signal_coverage >= 0.6 -- checked in classify() below
    min_confidence: 0.70,
  },
  {
    class: 'HIGH_FREQ_LOW_CONTEXT',
    baseline_risk: 'elevated',
    rules: [
      { signal: 'tokens_5_to_19',             check: p => p.operational.tokens_created >= 5 && p.operational.tokens_created < 20, weight: 0.50 },
      { signal: 'no_visible_funding',         check: p => p.structural.funding_sources_count === 0,            weight: 0.30 },
      { signal: 'fresh_or_short_active',      check: p => p.structural.wallet_age_days <= 14,                  weight: 0.20 },
    ],
    min_confidence: 0.50,
  },
  {
    class: 'CASUAL_CREATOR',
    baseline_risk: 'low',
    rules: [
      { signal: 'tokens_2_to_4',              check: p => p.operational.tokens_created >= 2 && p.operational.tokens_created <= 4, weight: 0.50 },
      { signal: 'visible_funding',            check: p => p.structural.funding_sources_count >= 1,             weight: 0.30 },
      { signal: 'moderate_sol_received',      check: p => p.behavioral.total_incoming_sol >= 0.5,              weight: 0.20 },
    ],
    min_confidence: 0.50,
  },
  {
    class: 'NEW_CREATOR',
    baseline_risk: 'low',
    rules: [
      { signal: 'single_token',               check: p => p.operational.tokens_created === 1,                  weight: 0.70 },
      { signal: 'minimal_history',            check: p => p.operational.total_signatures <= 20,                weight: 0.30 },
    ],
    min_confidence: 0.70,
  },
];

function classify(profile) {
  const p = profile.behavior_profile;
  const results = [];

  for (const archetype of ARCHETYPES) {
    const matched = [];
    let score = 0;
    for (const rule of archetype.rules) {
      if (rule.check(p)) {
        matched.push(rule.signal);
        score += rule.weight;
      }
    }
    const confidence = Math.min(Math.round(score * 100) / 100, 1.0);
    if (confidence >= archetype.min_confidence) {
      results.push({ class: archetype.class, confidence, baseline_risk: archetype.baseline_risk, matched_signals: matched });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);

  // PROFESSIONAL_CREATOR requires signal_coverage >= 0.6 (DECISION_009)
  // If data is synthetic, downgrade to HIGH_FREQ_LOW_CONTEXT
  const signalCoverage = profile.signal_coverage ?? 0.3;
  const filteredResults = results.filter(r => {
    if (r.class === 'PROFESSIONAL_CREATOR' && signalCoverage < 0.6) return false;
    return true;
  });

  let best = filteredResults[0] ?? results[0] ?? { class: 'UNKNOWN', confidence: 0, baseline_risk: 'unknown', matched_signals: [] };
  // EXCHANGE_FUNDED_DEPLOYER is now explicit archetype -- hidden post-processing removed (DECISION_009)

  return {
    mint: profile.mint,
    creator: profile.creator,
    liq_usd: profile.liq_usd,
    operator_class: best.class,
    confidence: best.confidence,
    baseline_risk: best.baseline_risk,
    matched_signals: best.matched_signals,
    all_matches: results,
    behavior_profile: p,
  };
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    try {
      const profile = JSON.parse(line.trim());
      const result = classify(profile);
      console.log(JSON.stringify(result));
      console.error(result.creator.slice(0,8)+'... -> '+result.operator_class+' ('+result.confidence+')');
    } catch (e) {
      console.error('parse error:', e.message);
    }
  }
}

main().catch(e => console.error(e.message));
