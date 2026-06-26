path = 'C:/Users/User/Desktop/nexusveritas-api/operator_classify.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# FIX 1: Add EXCHANGE_FUNDED_DEPLOYER before PROFESSIONAL_CREATOR
# FIX 2: Update PROFESSIONAL_CREATOR rules (days_active 7->30, add signal_coverage)
# FIX 3: Replace CASUAL_CREATOR with three archetypes
# FIX 4: Remove hidden post-processing
# FIX 5: Add isTrue/isFalse/isUnknown helpers

# --- Add helpers at top ---
old_readline = "const readline = require('readline');"
new_readline = """const readline = require('readline');

// Three-value logic helpers (DECISION_009)
// NULL/undefined = UNKNOWN, not false
const isTrue = v => v === true;
const isFalse = v => v === false;
const isUnknown = v => v === null || v === undefined;"""

if old_readline in code:
    code = code.replace(old_readline, new_readline)
    print('Helpers added!')
else:
    print('ERROR: readline pattern not found')

# --- Replace PROFESSIONAL_CREATOR + CASUAL_CREATOR block ---
old_block = """  {
    class: 'PROFESSIONAL_CREATOR',
    baseline_risk: 'low_medium',
    rules: [
      { signal: 'tokens_20_to_500',           check: p => p.operational.tokens_created >= 20 && p.operational.tokens_created < 500, weight: 0.40 },
      { signal: 'visible_funding',            check: p => p.structural.funding_sources_count >= 1,             weight: 0.30 },
      { signal: 'days_active_7_plus',         check: p => p.structural.wallet_age_days >= 7,                   weight: 0.30 },
    ],
    min_confidence: 0.40,
  },
  {
    class: 'CASUAL_CREATOR',
    baseline_risk: 'low',
    rules: [
      { signal: 'tokens_under_20',            check: p => p.operational.tokens_created < 20,                   weight: 0.40 },
      { signal: 'visible_funding',            check: p => p.structural.funding_sources_count >= 1,             weight: 0.35 },
      { signal: 'moderate_sol_received',      check: p => p.behavioral.total_incoming_sol >= 0.5,              weight: 0.25 },
    ],
    min_confidence: 0.40,
  },"""

new_block = """  {
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
  },"""

if old_block in code:
    code = code.replace(old_block, new_block)
    print('Archetypes updated: EXCHANGE_FUNDED_DEPLOYER + PROFESSIONAL + HIGH_FREQ + CASUAL + NEW_CREATOR!')
else:
    print('ERROR: archetype block not found')

# --- Remove hidden post-processing ---
old_hack = """  // FINDING_005 fix: reclassify INFRASTRUCTURE_HUB if pattern matches exchange funding
  if (best.class === 'INFRASTRUCTURE_HUB') {
    const sol = p.behavioral.total_incoming_sol;
    const sources = p.structural.funding_sources_count;
    const conc = p.structural.funding_concentration;
    const tokens = p.operational.tokens_created;
    // Exchange pattern: high SOL + multiple sources + high token count
    if (sol >= 100 && sources >= 3 && conc <= 0.8 && tokens >= 500) {
      best = { ...best, class: 'EXCHANGE_FUNDED_DEPLOYER', matched_signals: [...best.matched_signals, 'exchange_funding_pattern'] };
    }
  }"""
new_comment = """  // EXCHANGE_FUNDED_DEPLOYER is now explicit archetype -- hidden post-processing removed (DECISION_009)"""

if old_hack in code:
    code = code.replace(old_hack, new_comment)
    print('Hidden post-processing removed!')
else:
    print('ERROR: hidden post-processing not found')

# --- Add signal_coverage check for PROFESSIONAL_CREATOR ---
old_sort = """  results.sort((a, b) => b.confidence - a.confidence);
  let best = results[0] ?? { class: 'UNKNOWN', confidence: 0, baseline_risk: 'unknown', matched_signals: [] };"""
new_sort = """  results.sort((a, b) => b.confidence - a.confidence);

  // PROFESSIONAL_CREATOR requires signal_coverage >= 0.6 (DECISION_009)
  // If data is synthetic, downgrade to HIGH_FREQ_LOW_CONTEXT
  const signalCoverage = profile.signal_coverage ?? 0.3;
  const filteredResults = results.filter(r => {
    if (r.class === 'PROFESSIONAL_CREATOR' && signalCoverage < 0.6) return false;
    return true;
  });

  let best = filteredResults[0] ?? results[0] ?? { class: 'UNKNOWN', confidence: 0, baseline_risk: 'unknown', matched_signals: [] };"""

if old_sort in code:
    code = code.replace(old_sort, new_sort)
    print('signal_coverage check for PROFESSIONAL_CREATOR added!')
else:
    print('ERROR: sort pattern not found')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
print('All done!')
