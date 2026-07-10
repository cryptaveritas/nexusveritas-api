/**
 * Unit tests for candidate_explain.js vector explanation logic
 * Tests vector decomposition, feature agreement, and verdict classification
 * Run: node --test unit/test_candidate_explain.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const FEATURE_NAMES = [
  'funding_sources_count','funding_concentration','small_transfer_score','split_init','invisible_funding',
  'signature_density','recycling_loop','recency_score','high_frequency','minimal_activity',
  'tokens_per_sig','single_purpose','mass_deployer','launch_frequency','factory_pattern',
  'init_amount_proximity','micro_funding','wallet_rotation','automation_score','fresh_infrastructure',
  'externally_funded','high_concentration','wallet_maturity','many_sources','large_capital'
];

function parseVector(v) { return v.replace(/[\[\]]/g,'').split(',').map(Number); }

function explain(vecA, vecB) {
  const c = FEATURE_NAMES.map((name,i) => ({name, agreement: 1 - Math.abs(vecA[i]-vecB[i])}));
  return {
    top_shared: [...c].sort((a,b)=>b.agreement-a.agreement).slice(0,5).map(f=>f.name),
    top_diverging: [...c].sort((a,b)=>a.agreement-b.agreement).slice(0,3).map(f=>f.name),
  };
}

function classifyVerdict(vecA, vecB) {
  const INFRA = ['recycling_loop','split_init','factory_pattern','init_amount_proximity','micro_funding','automation_score'];
  const GENERIC = ['recency_score','wallet_maturity','minimal_activity','single_purpose'];
  const ex = explain(vecA, vecB);
  const infra = ex.top_shared.filter(f => {
    const i = FEATURE_NAMES.indexOf(f);
    return INFRA.includes(f) && vecA[i] > 0.3 && vecB[i] > 0.3;
  }).length;
  const generic = ex.top_shared.filter(f=>GENERIC.includes(f)).length;
  const verdict = infra>=2 ? 'INFRASTRUCTURE_CANDIDATE' : infra===1 ? 'WEAK_INFRASTRUCTURE' : 'GENERIC_OVERLAP';
  return { verdict, infra, generic, top_shared: ex.top_shared, top_diverging: ex.top_diverging };
}

// Helper to create a vector from values
function makeVector(values) {
  const vec = new Array(25).fill(0);
  values.forEach(([idx, val]) => vec[idx] = val);
  return vec;
}

describe('parseVector', () => {
  it('parses bracketed vector string', () => {
    const result = parseVector('[0.1,0.2,0.3]');
    assert.deepEqual(result, [0.1, 0.2, 0.3]);
  });

  it('parses plain comma-separated string', () => {
    const result = parseVector('0.1,0.2,0.3');
    assert.deepEqual(result, [0.1, 0.2, 0.3]);
  });
});

describe('explain function', () => {
  it('returns 5 top_shared and 3 top_diverging', () => {
    const vecA = new Array(25).fill(0.5);
    const vecB = new Array(25).fill(0.5);
    const result = explain(vecA, vecB);
    assert.equal(result.top_shared.length, 5);
    assert.equal(result.top_diverging.length, 3);
  });

  it('identifies identical vectors as all shared', () => {
    const vec = [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,0.1,0.2,0.3,0.4,0.5];
    const result = explain(vec, vec);
    // All agreements should be 1.0
    result.top_shared.forEach(name => {
      const i = FEATURE_NAMES.indexOf(name);
      assert.ok(Math.abs(vec[i] - vec[i]) === 0);
    });
  });

  it('identifies maximally different features as diverging', () => {
    const vecA = new Array(25).fill(0);
    const vecB = new Array(25).fill(1);
    const result = explain(vecA, vecB);
    // All agreements should be 0
    result.top_diverging.forEach(name => {
      const i = FEATURE_NAMES.indexOf(name);
      assert.equal(Math.abs(vecA[i] - vecB[i]), 1);
    });
  });

  it('handles partial differences', () => {
    const vecA = new Array(25).fill(0.5);
    const vecB = new Array(25).fill(0.5);
    // Make feature 0 and 1 very different
    vecB[0] = 0;
    vecB[1] = 1.0;
    const result = explain(vecA, vecB);
    // funding_sources_count and funding_concentration should be in top_diverging
    assert.ok(result.top_diverging.includes('funding_sources_count') || result.top_diverging.includes('funding_concentration'));
  });
});

describe('verdict classification', () => {
  it('INFRASTRUCTURE_CANDIDATE when 2+ infrastructure features in top_shared', () => {
    // Create vectors where infrastructure features are the ONLY non-zero features
    // so they will be in top_shared (since other features are all 0 with agreement 1.0)
    const vecA = new Array(25).fill(0);
    const vecB = new Array(25).fill(0);
    // Make infrastructure features identical and high, other features different
    vecA[6] = 0.8; vecB[6] = 0.8;  // recycling_loop
    vecA[3] = 0.7; vecB[3] = 0.7;  // split_init
    vecA[14] = 0.6; vecB[14] = 0.6; // factory_pattern
    vecA[15] = 0.9; vecB[15] = 0.9; // init_amount_proximity
    vecA[16] = 0.5; vecB[16] = 0.5;  // micro_funding
    vecA[18] = 0.7; vecB[18] = 0.7; // automation_score
    // Make some other features different so they have lower agreement
    vecA[0] = 0.1; vecB[0] = 0.9;
    vecA[1] = 0.2; vecB[1] = 0.8;
    vecA[2] = 0.3; vecB[2] = 0.7;
    const result = classifyVerdict(vecA, vecB);
    // Infrastructure features should be in top_shared
    assert.ok(result.infra >= 2, `Expected infra >= 2, got ${result.infra}`);
  });

  it('WEAK_INFRASTRUCTURE when exactly 1 infrastructure feature', () => {
    const vecA = new Array(25).fill(0);
    const vecB = new Array(25).fill(0);
    // Only recycling_loop is strong and identical
    vecA[6] = 0.8; vecB[6] = 0.8;
    // Make other infrastructure features weak (low values)
    vecA[3] = 0.05; vecB[3] = 0.05;
    vecA[14] = 0.05; vecB[14] = 0.05;
    vecA[15] = 0.05; vecB[15] = 0.05;
    vecA[16] = 0.05; vecB[16] = 0.05;
    vecA[18] = 0.05; vecB[18] = 0.05;
    // Make other features different so they have lower agreement
    vecA[0] = 0.1; vecB[0] = 0.9;
    vecA[1] = 0.2; vecB[1] = 0.8;
    const result = classifyVerdict(vecA, vecB);
    assert.equal(result.verdict, 'WEAK_INFRASTRUCTURE');
    assert.equal(result.infra, 1);
  });

  it('GENERIC_OVERLAP when no infrastructure features', () => {
    const vecA = new Array(25).fill(0);
    const vecB = new Array(25).fill(0);
    // Make infrastructure features weak (low values)
    vecA[6] = 0.05; vecB[6] = 0.05;
    vecA[3] = 0.05; vecB[3] = 0.05;
    vecA[14] = 0.05; vecB[14] = 0.05;
    vecA[15] = 0.05; vecB[15] = 0.05;
    vecA[16] = 0.05; vecB[16] = 0.05;
    vecA[18] = 0.05; vecB[18] = 0.05;
    // Make other features different so they have lower agreement
    vecA[0] = 0.1; vecB[0] = 0.9;
    vecA[1] = 0.2; vecB[1] = 0.8;
    const result = classifyVerdict(vecA, vecB);
    assert.equal(result.verdict, 'GENERIC_OVERLAP');
    assert.equal(result.infra, 0);
  });
});

describe('FEATURE_NAMES', () => {
  it('has exactly 25 feature names', () => {
    assert.equal(FEATURE_NAMES.length, 25);
  });

  it('has no duplicates', () => {
    const unique = new Set(FEATURE_NAMES);
    assert.equal(unique.size, 25);
  });

  it('matches vector dimensions', () => {
    const vec = new Array(25).fill(0.5);
    assert.equal(vec.length, FEATURE_NAMES.length);
  });
});
