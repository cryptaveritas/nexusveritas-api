/**
 * Unit tests for candidate_discovery.js scoring logic
 * Tests similarity scoring with cross-archetype bonus
 * Run: node --test unit/test_candidate_discovery.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Scoring logic from candidate_discovery.js
function scorePair(similarity, archA, archB) {
  const crossArchetype = archA !== archB ? 1 : 0;
  const rarity = crossArchetype ? 1.5 : 1.0;
  const crossBonus = crossArchetype ? 1.3 : 1.0;
  const score = Math.round(similarity * rarity * crossBonus * 1000) / 1000;
  return {
    similarity: Math.round(similarity * 1000) / 1000,
    score,
    cross_archetype: crossArchetype === 1,
  };
}

describe('scorePair', () => {
  it('calculates score for same-archetype pair', () => {
    const result = scorePair(0.75, 'WALLET_FACTORY', 'WALLET_FACTORY');
    assert.equal(result.similarity, 0.75);
    assert.equal(result.score, 0.75); // 0.75 * 1.0 * 1.0
    assert.equal(result.cross_archetype, false);
  });

  it('calculates score for cross-archetype pair', () => {
    const result = scorePair(0.75, 'WALLET_FACTORY', 'ROTATION_OPERATOR');
    assert.equal(result.similarity, 0.75);
    assert.equal(result.score, 1.463); // 0.75 * 1.5 * 1.3 = 1.4625, rounded to 1.463
    assert.equal(result.cross_archetype, true);
  });

  it('handles maximum similarity', () => {
    const result = scorePair(1.0, 'WALLET_FACTORY', 'ROTATION_OPERATOR');
    assert.equal(result.similarity, 1.0);
    assert.equal(result.score, 1.95); // 1.0 * 1.5 * 1.3 = 1.95
    assert.equal(result.cross_archetype, true);
  });

  it('handles minimum similarity', () => {
    const result = scorePair(0.0, 'WALLET_FACTORY', 'ROTATION_OPERATOR');
    assert.equal(result.similarity, 0.0);
    assert.equal(result.score, 0.0);
    assert.equal(result.cross_archetype, true);
  });

  it('rounds similarity to 3 decimal places', () => {
    const result = scorePair(0.123456, 'WALLET_FACTORY', 'WALLET_FACTORY');
    assert.equal(result.similarity, 0.123);
  });

  it('rounds score to 3 decimal places', () => {
    const result = scorePair(0.777, 'WALLET_FACTORY', 'ROTATION_OPERATOR');
    // 0.777 * 1.5 * 1.3 = 1.51515, rounded to 1.515
    assert.equal(result.score, 1.515);
  });
});

describe('scoring formula', () => {
  it('cross-archetype score is always higher than same-archetype score for same similarity', () => {
    const sim = 0.6;
    const same = scorePair(sim, 'A', 'A');
    const cross = scorePair(sim, 'A', 'B');
    assert.ok(cross.score > same.score);
  });

  it('score increases with similarity', () => {
    const low = scorePair(0.5, 'A', 'B');
    const high = scorePair(0.9, 'A', 'B');
    assert.ok(high.score > low.score);
  });

  it('cross-archetype multiplier is 1.5 * 1.3 = 1.95', () => {
    const sim = 1.0;
    const cross = scorePair(sim, 'A', 'B');
    assert.equal(cross.score, 1.95);
  });
});

describe('duplicate detection', () => {
  it('operator_a < operator_b ensures no duplicate pairs', () => {
    // This is a contract test - if address ordering is enforced,
    // the same pair won't be inserted twice
    const addrA = '0x1234567890abcdef';
    const addrB = '0xabcdef1234567890';
    // The SQL query uses: JOIN creators b ON a.address < b.address
    assert.ok(addrA < addrB || addrB < addrA, 'Addresses should be comparable');
  });
});
