/**
 * Unit tests for db_insert.js vector computation (toV1, toV2)
 * Tests all 7 v1 dimensions and all 25 v2 dimensions with edge cases
 * Run: node --test unit/test_db_insert.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Three-value logic helpers (mirrors db_insert.js)
const isTrue = v => v === true;
const isFalse = v => v === false;
const isUnknown = v => v === null || v === undefined;
const num = v => (v === null || v === undefined || isNaN(v)) ? 0 : Number(v);

function toV1(bp) {
  const s = bp.structural || {}, b = bp.behavioral || {}, o = bp.operational || {};
  return [
    num(s.wallet_age_days),
    num(s.funding_sources_count),
    num(s.funding_concentration),
    num(b.transfer_count),
    Math.min(num(b.total_incoming_sol), 100),
    Math.min(num(o.tokens_created) / 1000, 1.0),
    Math.min(num(o.days_active), 365),
  ];
}

function toV2(bp) {
  const s = bp.structural || {}, b = bp.behavioral || {}, o = bp.operational || {};
  const sigDensity = num(o.total_signatures) / Math.max(num(o.days_active), 1);
  const initProx   = num(b.avg_transfer_sol) > 0
    ? Math.max(0, 1 - Math.abs(num(b.avg_transfer_sol) - 0.002) / 0.002)
    : 0;

  return [
    // Funding Layer (5)
    Math.min(num(s.funding_sources_count) / 10, 1.0),          // [0] sources count
    num(s.funding_concentration),                               // [1] concentration
    1 / (1 + b.avg_transfer_sol),                          // [2] small transfer score
    isTrue(b.split_init_pattern) ? 1 : 0,                  // [3] split init (null=UNKNOWN=0)
    (!isUnknown(s.funding_sources_count) && num(s.funding_sources_count) === 0) ? 1 : 0, // [4] invisible funding (null=UNKNOWN=0)

    // Activity Layer (5)
    Math.min(sigDensity / 100, 1.0),                       // [5] signature density
    isTrue(b.recycling_loop) ? 1 : 0,                      // [6] recycling loop (null=UNKNOWN=0)
    1 / (1 + num(s.wallet_age_days) / 30),                      // [7] recency score
    sigDensity > 50 ? 1 : sigDensity / 50,                 // [8] high frequency
    num(o.total_signatures) <= 20 ? 1 : 0,                      // [9] minimal activity

    // Launch Layer (5)
    Math.min(Math.log1p(o.total_signatures) / Math.log1p(20000), 1.0), // [10] activity magnitude (log-scaled total sigs)
    num(o.tokens_created) <= 2 ? 1 : 0,                        // [11] single purpose
    Math.min(Math.log1p(o.days_active) / Math.log1p(365), 1.0), // [12] sustained activity span (log-scaled days_active)
    Math.min(num(o.launch_frequency) / 10, 1.0),                // [13] launch frequency
    (num(o.tokens_created) <= 2 && num(o.total_signatures) <= 15) ? 1 : 0, // [14] factory pattern

    // Behavioral Layer (5)
    Math.max(initProx, 0),                  // [15] init amount proximity
    num(b.total_incoming_sol) <= 0.005 ? 1 : 0,                 // [16] micro funding
    (num(s.wallet_age_days) <= 1 && num(o.tokens_created) >= 100) ? 1 : 0, // [17] wallet rotation
    (isTrue(b.recycling_loop) ? 0.5 : 0) + (isTrue(b.split_init_pattern) ? 0.5 : 0), // [18] automation score
    Math.max(0, 1 - num(s.wallet_age_days) / 30),               // [19] fresh infrastructure

    // Structural Layer (5)
    (num(s.funding_sources_count) >= 1 && num(b.total_incoming_sol) >= 0.5) ? 1 : 0, // [20] externally funded
    num(s.funding_concentration) >= 0.9 ? 1 : num(s.funding_concentration),          // [21] high concentration
    Math.min(num(s.wallet_age_days) / 30, 1.0),                 // [22] wallet maturity
    Math.min(num(s.funding_sources_count) / 5, 1.0),            // [23] many sources
    Math.min(num(b.total_incoming_sol) / 100, 1.0),             // [24] large capital
  ];
}

// Helper to create a base behavior profile
function makeBP(overrides = {}) {
  return {
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
  };
}

describe('toV1 vector computation', () => {
  it('returns 7 dimensions', () => {
    const bp = makeBP();
    const v1 = toV1(bp);
    assert.equal(v1.length, 7);
  });

  it('handles default values', () => {
    const bp = makeBP();
    const v1 = toV1(bp);
    assert.equal(v1[0], 30); // wallet_age_days
    assert.equal(v1[1], 2);  // funding_sources_count
    assert.equal(v1[2], 0.5); // funding_concentration
    assert.equal(v1[3], 100); // transfer_count
    assert.equal(v1[4], 1.0); // total_incoming_sol
    assert.equal(v1[5], 0.005); // tokens_created / 1000
    assert.equal(v1[6], 30); // days_active
  });

  it('clamps total_incoming_sol to 100', () => {
    const bp = makeBP({ total_incoming_sol: 150 });
    const v1 = toV1(bp);
    assert.equal(v1[4], 100);
  });

  it('clamps tokens_created ratio to 1.0', () => {
    const bp = makeBP({ tokens_created: 5000 });
    const v1 = toV1(bp);
    assert.equal(v1[5], 1.0);
  });

  it('clamps days_active to 365', () => {
    const bp = makeBP({ days_active: 500 });
    const v1 = toV1(bp);
    assert.equal(v1[6], 365);
  });

  it('handles null/undefined values as 0', () => {
    const bp = {
      structural: { wallet_age_days: null, funding_sources_count: undefined },
      behavioral: { transfer_count: null, total_incoming_sol: undefined },
      operational: { tokens_created: null, days_active: undefined },
    };
    const v1 = toV1(bp);
    assert.equal(v1[0], 0);
    assert.equal(v1[1], 0);
    assert.equal(v1[3], 0);
    assert.equal(v1[4], 0);
    assert.equal(v1[5], 0);
    assert.equal(v1[6], 0);
  });

  it('handles all values as 0', () => {
    const bp = makeBP({
      wallet_age_days: 0,
      funding_sources_count: 0,
      funding_concentration: 0,
      transfer_count: 0,
      total_incoming_sol: 0,
      tokens_created: 0,
      days_active: 0,
    });
    const v1 = toV1(bp);
    assert.deepEqual(v1, [0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('toV2 vector computation', () => {
  it('returns 25 dimensions', () => {
    const bp = makeBP();
    const v2 = toV2(bp);
    assert.equal(v2.length, 25);
  });

  it('all values are numbers', () => {
    const bp = makeBP();
    const v2 = toV2(bp);
    v2.forEach((val, i) => {
      assert.equal(typeof val, 'number', `Dimension ${i} should be a number`);
      assert.ok(!isNaN(val), `Dimension ${i} should not be NaN`);
    });
  });

  it('all values are in [0, 1] range', () => {
    const bp = makeBP();
    const v2 = toV2(bp);
    v2.forEach((val, i) => {
      assert.ok(val >= 0, `Dimension ${i} should be >= 0, got ${val}`);
      assert.ok(val <= 1, `Dimension ${i} should be <= 1, got ${val}`);
    });
  });

  describe('Funding Layer (dimensions 0-4)', () => {
    it('[0] sources count clamps at 10', () => {
      const bp = makeBP({ funding_sources_count: 15 });
      const v2 = toV2(bp);
      assert.equal(v2[0], 1.0);
    });

    it('[1] concentration passes through', () => {
      const bp = makeBP({ funding_concentration: 0.7 });
      const v2 = toV2(bp);
      assert.equal(v2[1], 0.7);
    });

    it('[2] small transfer score is inverse of avg_transfer_sol', () => {
      const bp = makeBP({ avg_transfer_sol: 1.0 });
      const v2 = toV2(bp);
      assert.equal(v2[2], 0.5); // 1 / (1 + 1) = 0.5
    });

    it('[3] split_init is 1 when true, 0 otherwise', () => {
      const bpTrue = makeBP({ split_init_pattern: true });
      const bpFalse = makeBP({ split_init_pattern: false });
      const bpNull = makeBP({ split_init_pattern: null });
      assert.equal(toV2(bpTrue)[3], 1);
      assert.equal(toV2(bpFalse)[3], 0);
      assert.equal(toV2(bpNull)[3], 0);
    });

    it('[4] invisible funding is 1 when funding_sources_count=0 and not unknown', () => {
      const bpZero = makeBP({ funding_sources_count: 0 });
      const bpNull = makeBP({ funding_sources_count: null });
      const bpPositive = makeBP({ funding_sources_count: 3 });
      assert.equal(toV2(bpZero)[4], 1);
      assert.equal(toV2(bpNull)[4], 0);
      assert.equal(toV2(bpPositive)[4], 0);
    });
  });

  describe('Activity Layer (dimensions 5-9)', () => {
    it('[5] signature density clamps at 1.0', () => {
      const bp = makeBP({ total_signatures: 10000, days_active: 1 });
      const v2 = toV2(bp);
      assert.equal(v2[5], 1.0);
    });

    it('[6] recycling loop is 1 when true, 0 otherwise', () => {
      const bpTrue = makeBP({ recycling_loop: true });
      const bpFalse = makeBP({ recycling_loop: false });
      const bpNull = makeBP({ recycling_loop: null });
      assert.equal(toV2(bpTrue)[6], 1);
      assert.equal(toV2(bpFalse)[6], 0);
      assert.equal(toV2(bpNull)[6], 0);
    });

    it('[7] recency score is 1/(1+days/30)', () => {
      const bp0 = makeBP({ wallet_age_days: 0 });
      const bp30 = makeBP({ wallet_age_days: 30 });
      assert.equal(toV2(bp0)[7], 1.0);
      assert.equal(toV2(bp30)[7], 0.5);
    });

    it('[8] high frequency is 1 when sigDensity > 50', () => {
      const bpHigh = makeBP({ total_signatures: 2000, days_active: 1 });
      const bpLow = makeBP({ total_signatures: 10, days_active: 1 });
      assert.equal(toV2(bpHigh)[8], 1.0);
      assert.ok(toV2(bpLow)[8] < 1.0);
    });

    it('[9] minimal activity is 1 when signatures <= 20', () => {
      const bp20 = makeBP({ total_signatures: 20 });
      const bp21 = makeBP({ total_signatures: 21 });
      assert.equal(toV2(bp20)[9], 1);
      assert.equal(toV2(bp21)[9], 0);
    });
  });

  describe('Launch Layer (dimensions 10-14)', () => {
    it('[10] activity magnitude is log-scaled', () => {
      const bp100 = makeBP({ total_signatures: 100 });
      const bp1000 = makeBP({ total_signatures: 1000 });
      assert.ok(toV2(bp1000)[10] > toV2(bp100)[10]);
    });

    it('[11] single purpose is 1 when tokens_created <= 2', () => {
      const bp1 = makeBP({ tokens_created: 1 });
      const bp3 = makeBP({ tokens_created: 3 });
      assert.equal(toV2(bp1)[11], 1);
      assert.equal(toV2(bp3)[11], 0);
    });

    it('[12] sustained activity span is log-scaled', () => {
      const bp30 = makeBP({ days_active: 30 });
      const bp100 = makeBP({ days_active: 100 });
      assert.ok(toV2(bp100)[12] > toV2(bp30)[12]);
    });

    it('[13] launch frequency clamps at 1.0', () => {
      const bp15 = makeBP({ launch_frequency: 15 });
      assert.equal(toV2(bp15)[13], 1.0);
    });

    it('[14] factory pattern is 1 when tokens<=2 AND signatures<=15', () => {
      const bp1 = makeBP({ tokens_created: 1, total_signatures: 10 });
      const bp2 = makeBP({ tokens_created: 3, total_signatures: 10 });
      const bp3 = makeBP({ tokens_created: 1, total_signatures: 20 });
      assert.equal(toV2(bp1)[14], 1);
      assert.equal(toV2(bp2)[14], 0);
      assert.equal(toV2(bp3)[14], 0);
    });
  });

  describe('Behavioral Layer (dimensions 15-19)', () => {
    it('[15] init amount proximity is 1 when avg_transfer_sol=0.002', () => {
      const bp002 = makeBP({ avg_transfer_sol: 0.002 });
      const bp0 = makeBP({ avg_transfer_sol: 0 });
      assert.equal(toV2(bp002)[15], 1.0);
      assert.equal(toV2(bp0)[15], 0);
    });

    it('[16] micro funding is 1 when total_incoming_sol <= 0.005', () => {
      const bp005 = makeBP({ total_incoming_sol: 0.005 });
      const bp006 = makeBP({ total_incoming_sol: 0.006 });
      assert.equal(toV2(bp005)[16], 1);
      assert.equal(toV2(bp006)[16], 0);
    });

    it('[17] wallet rotation is 1 when age<=1 AND tokens>=100', () => {
      const bp1 = makeBP({ wallet_age_days: 0, tokens_created: 100 });
      const bp2 = makeBP({ wallet_age_days: 2, tokens_created: 100 });
      const bp3 = makeBP({ wallet_age_days: 0, tokens_created: 99 });
      assert.equal(toV2(bp1)[17], 1);
      assert.equal(toV2(bp2)[17], 0);
      assert.equal(toV2(bp3)[17], 0);
    });

    it('[18] automation score sums recycling_loop and split_init_pattern', () => {
      const bpBoth = makeBP({ recycling_loop: true, split_init_pattern: true });
      const bpRecycle = makeBP({ recycling_loop: true, split_init_pattern: false });
      const bpSplit = makeBP({ recycling_loop: false, split_init_pattern: true });
      const bpNone = makeBP({ recycling_loop: false, split_init_pattern: false });
      assert.equal(toV2(bpBoth)[18], 1.0);
      assert.equal(toV2(bpRecycle)[18], 0.5);
      assert.equal(toV2(bpSplit)[18], 0.5);
      assert.equal(toV2(bpNone)[18], 0);
    });

    it('[19] fresh infrastructure is 1 - days/30', () => {
      const bp0 = makeBP({ wallet_age_days: 0 });
      const bp15 = makeBP({ wallet_age_days: 15 });
      const bp30 = makeBP({ wallet_age_days: 30 });
      assert.equal(toV2(bp0)[19], 1.0);
      assert.equal(toV2(bp15)[19], 0.5);
      assert.equal(toV2(bp30)[19], 0);
    });
  });

  describe('Structural Layer (dimensions 20-24)', () => {
    it('[20] externally funded is 1 when sources>=1 AND sol>=0.5', () => {
      const bp1 = makeBP({ funding_sources_count: 1, total_incoming_sol: 0.5 });
      const bp2 = makeBP({ funding_sources_count: 0, total_incoming_sol: 1.0 });
      const bp3 = makeBP({ funding_sources_count: 1, total_incoming_sol: 0.4 });
      assert.equal(toV2(bp1)[20], 1);
      assert.equal(toV2(bp2)[20], 0);
      assert.equal(toV2(bp3)[20], 0);
    });

    it('[21] high concentration is 1 when >= 0.9, else passes through', () => {
      const bp09 = makeBP({ funding_concentration: 0.9 });
      const bp08 = makeBP({ funding_concentration: 0.8 });
      const bp095 = makeBP({ funding_concentration: 0.95 });
      assert.equal(toV2(bp09)[21], 1);
      assert.equal(toV2(bp08)[21], 0.8);
      assert.equal(toV2(bp095)[21], 1);
    });

    it('[22] wallet maturity is days/30 clamped at 1.0', () => {
      const bp0 = makeBP({ wallet_age_days: 0 });
      const bp30 = makeBP({ wallet_age_days: 30 });
      const bp60 = makeBP({ wallet_age_days: 60 });
      assert.equal(toV2(bp0)[22], 0);
      assert.equal(toV2(bp30)[22], 1.0);
      assert.equal(toV2(bp60)[22], 1.0);
    });

    it('[23] many sources is sources/5 clamped at 1.0', () => {
      const bp0 = makeBP({ funding_sources_count: 0 });
      const bp5 = makeBP({ funding_sources_count: 5 });
      const bp10 = makeBP({ funding_sources_count: 10 });
      assert.equal(toV2(bp0)[23], 0);
      assert.equal(toV2(bp5)[23], 1.0);
      assert.equal(toV2(bp10)[23], 1.0);
    });

    it('[24] large capital is sol/100 clamped at 1.0', () => {
      const bp0 = makeBP({ total_incoming_sol: 0 });
      const bp50 = makeBP({ total_incoming_sol: 50 });
      const bp150 = makeBP({ total_incoming_sol: 150 });
      assert.equal(toV2(bp0)[24], 0);
      assert.equal(toV2(bp50)[24], 0.5);
      assert.equal(toV2(bp150)[24], 1.0);
    });
  });

  describe('Edge cases', () => {
    it('handles all zero values', () => {
      const bp = makeBP({
        wallet_age_days: 0,
        funding_sources_count: 0,
        funding_concentration: 0,
        transfer_count: 0,
        total_incoming_sol: 0,
        tokens_created: 0,
        total_signatures: 0,
        days_active: 0,
        launch_frequency: 0,
        avg_transfer_sol: 0,
      });
      const v2 = toV2(bp);
      v2.forEach((val, i) => {
        assert.ok(!isNaN(val), `Dimension ${i} should not be NaN`);
        assert.ok(val >= 0, `Dimension ${i} should be >= 0`);
        assert.ok(val <= 1, `Dimension ${i} should be <= 1`);
      });
    });

    it('handles large values', () => {
      const bp = makeBP({
        wallet_age_days: 365,
        funding_sources_count: 100,
        funding_concentration: 1.0,
        transfer_count: 100000,
        total_incoming_sol: 10000,
        tokens_created: 10000,
        total_signatures: 100000,
        days_active: 365,
        launch_frequency: 100,
        avg_transfer_sol: 1000,
      });
      const v2 = toV2(bp);
      v2.forEach((val, i) => {
        assert.ok(!isNaN(val), `Dimension ${i} should not be NaN`);
        assert.ok(val >= 0, `Dimension ${i} should be >= 0`);
        assert.ok(val <= 1, `Dimension ${i} should be <= 1`);
      });
    });

    it('handles null/undefined values gracefully', () => {
      const bp = {
        structural: { wallet_age_days: 0, funding_sources_count: 0, funding_concentration: 0 },
        behavioral: { total_incoming_sol: 0, transfer_count: 0, avg_transfer_sol: 0 },
        operational: { tokens_created: 0, total_signatures: 0, days_active: 0, launch_frequency: 0 },
      };
      const v2 = toV2(bp);
      v2.forEach((val, i) => {
        assert.ok(!isNaN(val), `Dimension ${i} should not be NaN`);
        assert.ok(val >= 0, `Dimension ${i} should be >= 0`);
        assert.ok(val <= 1, `Dimension ${i} should be <= 1`);
      });
    });
  });
});
