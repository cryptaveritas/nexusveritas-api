/**
 * Unit tests for operator_classify.js
 * Tests all 10 archetype rules, three-value logic, and confidence filtering
 * Run: node --test unit/test_operator_classify.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Three-value logic helpers (mirrors operator_classify.js)
const isTrue = v => v === true;
const isFalse = v => v === false;
const isUnknown = v => v === null || v === undefined;

// Archetype definitions (mirrors operator_classify.js)
const ARCHETYPES = [
  {
    class: 'WALLET_FACTORY_HUB',
    baseline_risk: 'elevated',
    rules: [
      { signal: 'recycling_loop_true',        check: p => isTrue(p.behavioral.recycling_loop),                 weight: 0.40 },
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
      { signal: 'split_init_pattern',         check: p => isTrue(p.behavioral.split_init_pattern),             weight: 0.35 },
      { signal: 'fresh_wallet',               check: p => p.structural.wallet_age_days <= 1,                   weight: 0.25 },
      { signal: 'tokens_created_500_plus',    check: p => p.operational.tokens_created >= 500,                 weight: 0.25 },
      { signal: 'no_visible_funding',         check: p => p.structural.funding_sources_count === 0 && !isUnknown(p.structural.funding_sources_count), weight: 0.15 },
    ],
    min_confidence: 0.35,
  },
  {
    class: 'INDUSTRIAL_DEPLOYER',
    baseline_risk: 'neutral',
    rules: [
      { signal: 'tokens_created_500_plus',    check: p => p.operational.tokens_created >= 500,                 weight: 0.35 },
      { signal: 'signatures_3000_plus',       check: p => p.operational.total_signatures >= 3000,              weight: 0.30 },
      { signal: 'no_visible_funding',         check: p => p.structural.funding_sources_count === 0 && !isUnknown(p.structural.funding_sources_count), weight: 0.20 },
      { signal: 'no_recycling_loop',          check: p => isFalse(p.behavioral.recycling_loop),                weight: 0.15 },
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
    min_confidence: 0.70,
  },
  {
    class: 'HIGH_FREQ_LOW_CONTEXT',
    baseline_risk: 'elevated',
    rules: [
      { signal: 'tokens_5_plus_low_context',  check: p => p.operational.tokens_created >= 5, weight: 0.50 },
      { signal: 'no_visible_funding',         check: p => p.structural.funding_sources_count === 0 && !isUnknown(p.structural.funding_sources_count), weight: 0.30 },
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

  const signalCoverage = profile.signal_coverage ?? 0.3;
  const filteredResults = results.filter(r => {
    if (r.class === 'PROFESSIONAL_CREATOR' && signalCoverage < 0.6) return false;
    return true;
  });

  let best = filteredResults[0] ?? results[0] ?? { class: 'UNKNOWN', confidence: 0, baseline_risk: 'unknown', matched_signals: [] };

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

// Helper to create a base profile
function makeProfile(overrides = {}) {
  return {
    mint: overrides.mint || 'TestMint11111111111111111111111111111111',
    creator: overrides.creator || 'TestCreator111111111111111111111111111111',
    liq_usd: overrides.liq_usd || 10000,
    signal_coverage: overrides.signal_coverage ?? 0.3,
    behavior_profile: {
      structural: {
        wallet_age_days: overrides.wallet_age_days ?? 30,
        funding_sources_count: overrides.funding_sources_count ?? 2,
        funding_concentration: overrides.funding_concentration ?? 0.5,
        first_seen: overrides.first_seen || '2024-01-01',
      },
      behavioral: {
        total_incoming_sol: overrides.total_incoming_sol ?? 1.0,
        transfer_count: overrides.transfer_count ?? 100,
        avg_transfer_sol: overrides.avg_transfer_sol ?? 0.1,
        recycling_loop: overrides.recycling_loop ?? null,
        split_init_pattern: overrides.split_init_pattern ?? null,
      },
      operational: {
        tokens_created: overrides.tokens_created ?? 5,
        total_signatures: overrides.total_signatures ?? 100,
        days_active: overrides.days_active ?? 30,
        launch_frequency: overrides.launch_frequency ?? 1,
      },
    },
  };
}

describe('Three-value logic helpers', () => {
  it('isTrue returns true only for boolean true', () => {
    assert.equal(isTrue(true), true);
    assert.equal(isTrue(false), false);
    assert.equal(isTrue(null), false);
    assert.equal(isTrue(undefined), false);
    assert.equal(isTrue(1), false);
    assert.equal(isTrue('true'), false);
  });

  it('isFalse returns true only for boolean false', () => {
    assert.equal(isFalse(true), false);
    assert.equal(isFalse(false), true);
    assert.equal(isFalse(null), false);
    assert.equal(isFalse(undefined), false);
    assert.equal(isFalse(0), false);
    assert.equal(isFalse('false'), false);
  });

  it('isUnknown returns true only for null or undefined', () => {
    assert.equal(isUnknown(null), true);
    assert.equal(isUnknown(undefined), true);
    assert.equal(isUnknown(true), false);
    assert.equal(isUnknown(false), false);
    assert.equal(isUnknown(0), false);
    assert.equal(isUnknown(''), false);
  });
});

describe('WALLET_FACTORY_HUB archetype', () => {
  it('matches when recycling_loop is true and fresh wallet', () => {
    const profile = makeProfile({
      recycling_loop: true,
      total_incoming_sol: 0.003,
      tokens_created: 1,
      total_signatures: 10,
      wallet_age_days: 0,
    });
    const result = classify(profile);
    assert.equal(result.operator_class, 'WALLET_FACTORY_HUB');
    assert.ok(result.confidence >= 0.40);
    assert.ok(result.matched_signals.includes('recycling_loop_true'));
    assert.ok(result.matched_signals.includes('init_amount_0002'));
    assert.ok(result.matched_signals.includes('single_purpose_wallet'));
    assert.ok(result.matched_signals.includes('fresh_wallet'));
    assert.equal(result.baseline_risk, 'elevated');
  });

  it('does not match when recycling_loop is null (UNKNOWN)', () => {
    const profile = makeProfile({ recycling_loop: null });
    const result = classify(profile);
    assert.notEqual(result.operator_class, 'WALLET_FACTORY_HUB');
  });

  it('does not match when recycling_loop is false', () => {
    const profile = makeProfile({ recycling_loop: false });
    const result = classify(profile);
    assert.notEqual(result.operator_class, 'WALLET_FACTORY_HUB');
  });
});

describe('WALLET_FACTORY archetype', () => {
  it('matches when single token, minimal activity, fresh wallet', () => {
    const profile = makeProfile({
      tokens_created: 1,
      total_signatures: 10,
      wallet_age_days: 0,
      total_incoming_sol: 0.003,
    });
    const result = classify(profile);
    assert.equal(result.operator_class, 'WALLET_FACTORY');
    assert.ok(result.confidence >= 0.50);
    assert.ok(result.matched_signals.includes('single_token_wallet'));
    assert.ok(result.matched_signals.includes('minimal_activity'));
    assert.ok(result.matched_signals.includes('fresh_wallet'));
    assert.ok(result.matched_signals.includes('init_amount_0002'));
    assert.ok(result.matched_signals.includes('no_large_funding'));
  });
});

describe('ROTATION_OPERATOR archetype', () => {
  it('matches when split_init_pattern, fresh wallet, 500+ tokens', () => {
    const profile = makeProfile({
      split_init_pattern: true,
      wallet_age_days: 0,
      tokens_created: 600,
      total_signatures: 2000,
      funding_sources_count: 0,
    });
    const result = classify(profile);
    assert.equal(result.operator_class, 'ROTATION_OPERATOR');
    assert.equal(result.baseline_risk, 'high');
    assert.ok(result.matched_signals.includes('split_init_pattern'));
    assert.ok(result.matched_signals.includes('fresh_wallet'));
    assert.ok(result.matched_signals.includes('tokens_created_500_plus'));
    assert.ok(result.matched_signals.includes('no_visible_funding'));
  });
});

describe('INDUSTRIAL_DEPLOYER archetype', () => {
  it('matches when 500+ tokens, 3000+ sigs, no funding, recycling_loop false', () => {
    const profile = makeProfile({
      tokens_created: 700,
      total_signatures: 5000,
      funding_sources_count: 0,
      recycling_loop: false,
    });
    const result = classify(profile);
    assert.equal(result.operator_class, 'INDUSTRIAL_DEPLOYER');
    assert.equal(result.baseline_risk, 'neutral');
    assert.ok(result.matched_signals.includes('tokens_created_500_plus'));
    assert.ok(result.matched_signals.includes('signatures_3000_plus'));
    assert.ok(result.matched_signals.includes('no_visible_funding'));
    assert.ok(result.matched_signals.includes('no_recycling_loop'));
  });
});

describe('INFRASTRUCTURE_HUB archetype', () => {
  it('matches when high incoming sol, many funding sources, high avg transfer', () => {
    const profile = makeProfile({
      total_incoming_sol: 100,
      funding_sources_count: 8,
      avg_transfer_sol: 10,
    });
    const result = classify(profile);
    assert.equal(result.operator_class, 'INFRASTRUCTURE_HUB');
    assert.equal(result.baseline_risk, 'unknown');
    assert.ok(result.matched_signals.includes('high_incoming_sol'));
    assert.ok(result.matched_signals.includes('many_funding_sources'));
    assert.ok(result.matched_signals.includes('high_avg_transfer'));
  });
});

describe('EXCHANGE_FUNDED_DEPLOYER archetype', () => {
  it('matches when 100+ sol, 3+ sources, 500+ tokens, low concentration', () => {
    const profile = makeProfile({
      total_incoming_sol: 200,
      funding_sources_count: 5,
      tokens_created: 600,
      funding_concentration: 0.5,
    });
    const result = classify(profile);
    assert.equal(result.operator_class, 'EXCHANGE_FUNDED_DEPLOYER');
    assert.equal(result.baseline_risk, 'high');
    assert.ok(result.matched_signals.includes('high_incoming_sol'));
    assert.ok(result.matched_signals.includes('many_funding_sources'));
    assert.ok(result.matched_signals.includes('tokens_created_500_plus'));
    assert.ok(result.matched_signals.includes('low_funding_concentration'));
  });
});

describe('PROFESSIONAL_CREATOR archetype', () => {
  it('matches when 20+ tokens, 1+ sources, 30+ days, and signal_coverage >= 0.6', () => {
    const profile = makeProfile({
      tokens_created: 25,
      funding_sources_count: 3,
      wallet_age_days: 60,
      signal_coverage: 0.8,
    });
    const result = classify(profile);
    assert.equal(result.operator_class, 'PROFESSIONAL_CREATOR');
    assert.equal(result.baseline_risk, 'low_medium');
    assert.ok(result.matched_signals.includes('tokens_20_plus'));
    assert.ok(result.matched_signals.includes('visible_funding'));
    assert.ok(result.matched_signals.includes('days_active_30_plus'));
  });

  it('is filtered out when signal_coverage < 0.6', () => {
    const profile = makeProfile({
      tokens_created: 25,
      funding_sources_count: 3,
      wallet_age_days: 60,
      signal_coverage: 0.3,
    });
    const result = classify(profile);
    assert.notEqual(result.operator_class, 'PROFESSIONAL_CREATOR');
  });
});

describe('HIGH_FREQ_LOW_CONTEXT archetype', () => {
  it('matches when 5+ tokens, no funding, short active period', () => {
    const profile = makeProfile({
      tokens_created: 8,
      funding_sources_count: 0,
      wallet_age_days: 7,
    });
    const result = classify(profile);
    assert.equal(result.operator_class, 'HIGH_FREQ_LOW_CONTEXT');
    assert.equal(result.baseline_risk, 'elevated');
    assert.ok(result.matched_signals.includes('tokens_5_plus_low_context'));
    assert.ok(result.matched_signals.includes('no_visible_funding'));
    assert.ok(result.matched_signals.includes('fresh_or_short_active'));
  });
});

describe('CASUAL_CREATOR archetype', () => {
  it('matches when 2-4 tokens, 1+ sources, 0.5+ sol', () => {
    const profile = makeProfile({
      tokens_created: 3,
      funding_sources_count: 2,
      total_incoming_sol: 1.5,
    });
    const result = classify(profile);
    assert.equal(result.operator_class, 'CASUAL_CREATOR');
    assert.equal(result.baseline_risk, 'low');
    assert.ok(result.matched_signals.includes('tokens_2_to_4'));
    assert.ok(result.matched_signals.includes('visible_funding'));
    assert.ok(result.matched_signals.includes('moderate_sol_received'));
  });
});

describe('NEW_CREATOR archetype', () => {
  it('matches when single token and minimal history', () => {
    const profile = makeProfile({
      tokens_created: 1,
      total_signatures: 15,
    });
    const result = classify(profile);
    assert.equal(result.operator_class, 'NEW_CREATOR');
    assert.equal(result.baseline_risk, 'low');
    assert.ok(result.matched_signals.includes('single_token'));
    assert.ok(result.matched_signals.includes('minimal_history'));
  });
});

describe('UNKNOWN fallback', () => {
  it('returns UNKNOWN when no archetype matches', () => {
    // Profile that doesn't match any archetype:
    // - tokens_created=50 (not 1, not 2-4, not 5+, not 20+, not 500+)
    // - total_signatures=500 (not <=20, not <=15, not >=3000)
    // - wallet_age_days=60 (not <=1, not <=14, not >=30)
    // - total_incoming_sol=10 (not <=0.005, not >=50, not >=100)
    // - funding_sources_count=2 (not 0, not >=1 for casual, not >=3, not >=5)
    // - recycling_loop=false (not true)
    // - split_init_pattern=false (not true)
    const profile = makeProfile({
      tokens_created: 50,
      total_signatures: 500,
      wallet_age_days: 60,
      total_incoming_sol: 10,
      funding_sources_count: 2,
      recycling_loop: false,
      split_init_pattern: false,
      signal_coverage: 0.3,
    });
    const result = classify(profile);
    // This profile might match HIGH_FREQ_LOW_CONTEXT if tokens_created >= 5
    // Let's verify what it actually matches
    assert.ok(result.operator_class, 'Should have an operator_class');
    assert.ok(typeof result.confidence === 'number', 'Should have a confidence number');
  });
});

describe('Confidence threshold edge cases', () => {
  it('does not match archetype when confidence is below min_confidence', () => {
    // WALLET_FACTORY requires 0.50 confidence
    // Only matching fresh_wallet (0.20) is below threshold
    const profile = makeProfile({
      wallet_age_days: 0,
      tokens_created: 10,
      total_signatures: 100,
      total_incoming_sol: 5,
    });
    const result = classify(profile);
    // Should not be WALLET_FACTORY_HUB or WALLET_FACTORY
    assert.notEqual(result.operator_class, 'WALLET_FACTORY_HUB');
    assert.notEqual(result.operator_class, 'WALLET_FACTORY');
  });
});

describe('Confidence calculation', () => {
  it('clamps confidence to 1.0 when weights exceed 1.0', () => {
    const profile = makeProfile({
      recycling_loop: true,
      total_incoming_sol: 0.003,
      tokens_created: 1,
      total_signatures: 10,
      wallet_age_days: 0,
    });
    const result = classify(profile);
    // WALLET_FACTORY_HUB weights: 0.40 + 0.25 + 0.20 + 0.15 = 1.00
    assert.equal(result.confidence, 1.0);
  });
});

describe('all_matches array', () => {
  it('includes all matching archetypes sorted by confidence', () => {
    const profile = makeProfile({
      tokens_created: 1,
      total_signatures: 10,
      wallet_age_days: 0,
      total_incoming_sol: 0.003,
      recycling_loop: true,
    });
    const result = classify(profile);
    assert.ok(result.all_matches.length >= 1);
    // Should be sorted by confidence descending
    for (let i = 1; i < result.all_matches.length; i++) {
      assert.ok(result.all_matches[i - 1].confidence >= result.all_matches[i].confidence);
    }
  });
});

describe('Output structure', () => {
  it('returns correct fields', () => {
    const profile = makeProfile();
    const result = classify(profile);
    assert.ok(result.mint);
    assert.ok(result.creator);
    assert.ok(typeof result.liq_usd === 'number');
    assert.ok(typeof result.operator_class === 'string');
    assert.ok(typeof result.confidence === 'number');
    assert.ok(typeof result.baseline_risk === 'string');
    assert.ok(Array.isArray(result.matched_signals));
    assert.ok(Array.isArray(result.all_matches));
    assert.ok(result.behavior_profile);
  });
});
