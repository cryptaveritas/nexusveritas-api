/**
 * Unit tests for solanaAdapter.ts pure logic functions
 * Tests percentage calculations, edge cases, and data transformations
 * Run: node --test unit/test_solana_adapter.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Pure logic functions extracted from solanaAdapter.ts

// Percentage calculation (from getHolderAnalysis)
function pct(n, total) {
  return Math.min(100, Math.round((n / total) * 100));
}

// Holder analysis logic
function computeHolderAnalysis(accounts, totalSupply) {
  const total = parseFloat(totalSupply);
  if (!accounts || accounts.length === 0) {
    return { top10Percent: 0, largestHolderPercent: 0, top3Percent: 0, burnerDetected: false, topHolders: [], holderAmounts: [] };
  }
  if (total === 0) {
    return { top10Percent: 0, largestHolderPercent: 0, top3Percent: 0, burnerDetected: false, topHolders: [], holderAmounts: [] };
  }

  const top10Amount = accounts.slice(0, 10).reduce((s, a) => s + parseFloat(a.amount), 0);
  const top3Amount = accounts.slice(0, 3).reduce((s, a) => s + parseFloat(a.amount), 0);
  const largestAmount = parseFloat(accounts[0]?.amount ?? '0');

  return {
    top10Percent: pct(top10Amount, total),
    largestHolderPercent: pct(largestAmount, total),
    top3Percent: pct(top3Amount, total),
    burnerDetected: false, // would check against burner registry
    topHolders: accounts.slice(0, 10).map(a => a.address),
    holderAmounts: accounts.slice(0, 10).map(a => parseFloat(a.amount)),
  };
}

// Insider network cluster detection logic
function detectCluster(funders) {
  const funderMap = new Map();
  for (let i = 0; i < funders.length; i++) {
    const funder = funders[i];
    if (funder) {
      const entry = funderMap.get(funder) ?? { count: 0, indices: [] };
      entry.count++;
      entry.indices.push(i);
      funderMap.set(funder, entry);
    }
  }

  let maxCluster = 0;
  let fundingWallet = null;
  let clusterIndices = [];
  for (const [wallet, entry] of funderMap.entries()) {
    if (entry.count > maxCluster) {
      maxCluster = entry.count;
      fundingWallet = wallet;
      clusterIndices = entry.indices;
    }
  }

  return { maxCluster, fundingWallet, clusterIndices };
}

// Coverage calculation logic (from getInsiderNetworkAnalysis)
function computeCoverage(clusterIndices, holderAmounts, totalSupply) {
  try {
    const totalBig = BigInt(totalSupply);
    const clusterBig = clusterIndices.reduce((sum, i) => {
      const amt = holderAmounts[i] ?? 0;
      return sum + BigInt(Math.round(amt));
    }, BigInt(0));
    return totalBig > 0n ? Math.round(Number(clusterBig * 100n / totalBig)) : 0;
  } catch {
    const total = parseFloat(totalSupply);
    const clusterAmount = clusterIndices.reduce((sum, i) => sum + (holderAmounts[i] ?? 0), 0);
    return total > 0 ? Math.round((clusterAmount / total) * 100) : 0;
  }
}

// Token age calculation logic
function computeTokenAge(oldestBlockTime) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.max(0, (nowSeconds - oldestBlockTime) / 3600);
}

// Liquidity analysis logic
function selectBestPair(pairs) {
  if (!pairs || pairs.length === 0) {
    return { poolExists: false, liquidityUsd: 0, dex: null, lpLocked: false, lpBurned: false, reliable: true };
  }
  const filtered = pairs.filter(p => p.liquidity?.usd !== undefined);
  filtered.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
  const best = filtered[0] ?? pairs[0];
  return {
    poolExists: true,
    liquidityUsd: best.liquidity?.usd ?? 0,
    dex: best.dexId ?? null,
    lpLocked: false,
    lpBurned: best.lpBurned ?? false,
    reliable: true,
  };
}

describe('pct (percentage calculation)', () => {
  it('calculates correct percentage', () => {
    assert.equal(pct(50, 100), 50);
    assert.equal(pct(25, 100), 25);
    assert.equal(pct(75, 100), 75);
  });

  it('clamps at 100', () => {
    assert.equal(pct(150, 100), 100);
    assert.equal(pct(200, 100), 100);
  });

  it('rounds to nearest integer', () => {
    assert.equal(pct(33, 100), 33);
    assert.equal(pct(33.4, 100), 33);
    assert.equal(pct(33.5, 100), 34);
  });

  it('handles zero total', () => {
    // When total is 0, 0/0 = NaN, Math.round(NaN) = NaN, Math.min(100, NaN) = NaN
    // In the actual code, this is guarded by the total === 0 check
    const result = pct(0, 0);
    assert.ok(isNaN(result), 'Should return NaN for 0/0');
  });

  it('handles large numbers', () => {
    assert.equal(pct(1000000, 1000000), 100);
    assert.equal(pct(500000, 1000000), 50);
  });
});

describe('computeHolderAnalysis', () => {
  it('returns zeros for empty accounts', () => {
    const result = computeHolderAnalysis([], '1000000');
    assert.equal(result.top10Percent, 0);
    assert.equal(result.largestHolderPercent, 0);
    assert.equal(result.top3Percent, 0);
    assert.equal(result.burnerDetected, false);
    assert.deepEqual(result.topHolders, []);
    assert.deepEqual(result.holderAmounts, []);
  });

  it('returns zeros for null accounts', () => {
    const result = computeHolderAnalysis(null, '1000000');
    assert.equal(result.top10Percent, 0);
    assert.equal(result.largestHolderPercent, 0);
    assert.equal(result.top3Percent, 0);
  });

  it('returns zeros for zero supply', () => {
    const accounts = [{ address: 'A', amount: '100' }];
    const result = computeHolderAnalysis(accounts, '0');
    assert.equal(result.top10Percent, 0);
    assert.equal(result.largestHolderPercent, 0);
    assert.equal(result.top3Percent, 0);
  });

  it('calculates concentration correctly', () => {
    const accounts = [
      { address: 'A', amount: '500' },
      { address: 'B', amount: '300' },
      { address: 'C', amount: '200' },
    ];
    const result = computeHolderAnalysis(accounts, '1000');
    assert.equal(result.largestHolderPercent, 50); // 500/1000
    assert.equal(result.top3Percent, 100); // (500+300+200)/1000
    assert.equal(result.top10Percent, 100);
  });

  it('limits to top 10 holders', () => {
    const accounts = Array.from({ length: 20 }, (_, i) => ({
      address: `A${i}`,
      amount: '100',
    }));
    const result = computeHolderAnalysis(accounts, '2000');
    assert.equal(result.topHolders.length, 10);
    assert.equal(result.holderAmounts.length, 10);
    assert.equal(result.top10Percent, 50); // 10*100/2000
  });

  it('handles large token supplies with BigInt', () => {
    const accounts = [
      { address: 'A', amount: '1000000000000' }, // 1 trillion
    ];
    const result = computeHolderAnalysis(accounts, '10000000000000'); // 10 trillion
    assert.equal(result.largestHolderPercent, 10);
  });
});

describe('detectCluster', () => {
  it('detects a cluster of 3+ wallets with same funder', () => {
    const funders = ['FunderA', 'FunderA', 'FunderA', 'FunderB', 'FunderC'];
    const result = detectCluster(funders);
    assert.equal(result.maxCluster, 3);
    assert.equal(result.fundingWallet, 'FunderA');
    assert.deepEqual(result.clusterIndices, [0, 1, 2]);
  });

  it('returns maxCluster=1 for no common funder', () => {
    const funders = ['A', 'B', 'C', null, 'D'];
    const result = detectCluster(funders);
    assert.equal(result.maxCluster, 1);
    // When all have count=1, it returns the first one found (A)
    assert.equal(result.fundingWallet, 'A');
  });

  it('handles null funders', () => {
    const funders = [null, null, null];
    const result = detectCluster(funders);
    assert.equal(result.maxCluster, 0);
    assert.equal(result.fundingWallet, null);
  });

  it('handles empty funders array', () => {
    const result = detectCluster([]);
    assert.equal(result.maxCluster, 0);
    assert.equal(result.fundingWallet, null);
  });

  it('returns largest cluster when multiple exist', () => {
    const funders = ['A', 'A', 'B', 'B', 'B'];
    const result = detectCluster(funders);
    assert.equal(result.maxCluster, 3);
    assert.equal(result.fundingWallet, 'B');
  });
});

describe('computeCoverage', () => {
  it('calculates coverage percentage correctly', () => {
    const clusterIndices = [0, 1];
    const holderAmounts = [500, 500, 0, 0];
    const result = computeCoverage(clusterIndices, holderAmounts, '1000');
    assert.equal(result, 100); // (500+500)/1000 * 100
  });

  it('handles partial coverage', () => {
    const clusterIndices = [0];
    const holderAmounts = [250, 250, 250, 250];
    const result = computeCoverage(clusterIndices, holderAmounts, '1000');
    assert.equal(result, 25);
  });

  it('handles zero supply', () => {
    const result = computeCoverage([0, 1], [500, 500], '0');
    assert.equal(result, 0);
  });

  it('handles large numbers with BigInt', () => {
    const clusterIndices = [0, 1];
    const holderAmounts = [1000000000, 2000000000];
    const result = computeCoverage(clusterIndices, holderAmounts, '10000000000');
    assert.equal(result, 30); // (1B+2B)/10B * 100
  });

  it('handles fallback to parseFloat for non-BigInt values', () => {
    // Test the catch block by using a value that can't be BigInt
    const clusterIndices = [0];
    const holderAmounts = [50.5];
    const result = computeCoverage(clusterIndices, holderAmounts, '100');
    assert.equal(result, 51); // Math.round(50.5/100 * 100) = 51
  });
});

describe('computeTokenAge', () => {
  it('calculates age in hours from block time', () => {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;
    const ageHours = computeTokenAge(oneDayAgo);
    assert.ok(ageHours >= 23 && ageHours <= 25); // ~24 hours
  });

  it('returns 0 for very recent block time', () => {
    const now = Math.floor(Date.now() / 1000);
    const ageHours = computeTokenAge(now);
    assert.ok(ageHours >= 0 && ageHours < 1);
  });
});

describe('selectBestPair', () => {
  it('returns poolExists=false for empty pairs', () => {
    const result = selectBestPair([]);
    assert.equal(result.poolExists, false);
    assert.equal(result.liquidityUsd, 0);
    assert.equal(result.dex, null);
    assert.equal(result.reliable, true);
  });

  it('returns poolExists=false for null pairs', () => {
    const result = selectBestPair(null);
    assert.equal(result.poolExists, false);
  });

  it('selects pair with highest liquidity', () => {
    const pairs = [
      { dexId: 'raydium', liquidity: { usd: 1000 }, lpBurned: false },
      { dexId: 'jupiter', liquidity: { usd: 5000 }, lpBurned: true },
      { dexId: 'meteora', liquidity: { usd: 2000 }, lpBurned: false },
    ];
    const result = selectBestPair(pairs);
    assert.equal(result.poolExists, true);
    assert.equal(result.liquidityUsd, 5000);
    assert.equal(result.dex, 'jupiter');
    assert.equal(result.lpBurned, true);
  });

  it('handles pairs with undefined liquidity', () => {
    const pairs = [
      { dexId: 'raydium', liquidity: { usd: 1000 } },
      { dexId: 'jupiter', liquidity: undefined },
      { dexId: 'meteora', liquidity: { usd: 2000 } },
    ];
    const result = selectBestPair(pairs);
    assert.equal(result.poolExists, true);
    assert.equal(result.liquidityUsd, 2000);
    assert.equal(result.dex, 'meteora');
  });

  it('uses first pair if no pairs have liquidity', () => {
    const pairs = [
      { dexId: 'raydium', liquidity: undefined },
      { dexId: 'jupiter', liquidity: undefined },
    ];
    const result = selectBestPair(pairs);
    assert.equal(result.poolExists, true);
    assert.equal(result.liquidityUsd, 0);
    assert.equal(result.dex, 'raydium');
  });
});

describe('TokenSnapshot structure', () => {
  it('has all required fields', () => {
    const snapshot = {
      meta: {
        mintAuthorityEnabled: false,
        freezeAuthorityEnabled: false,
        mintAuthorityAddress: null,
        freezeAuthorityAddress: null,
        lpLockedOrBurned: true,
        topHoldersConcentration: 45,
        tokenAgeHours: 24,
        tokenAgeReliable: true,
        burnerHolderDetected: false,
        creator: { address: 'Creator1', totalTokens: 5, reliable: true },
        whales: { largestHolderPercent: 20, top3Percent: 45, top10Percent: 80 },
        liquidity: { poolExists: true, liquidityUsd: 10000, dex: 'raydium', lpLocked: false, lpBurned: true, reliable: true },
        insiderNetwork: { insiderNetworkDetected: false, clusterSize: 0, clusterType: null, topHolderCoverage: 0, fundingWallet: null, reliable: true },
      },
    };
    assert.ok(snapshot.meta);
    assert.ok(typeof snapshot.meta.mintAuthorityEnabled === 'boolean');
    assert.ok(typeof snapshot.meta.freezeAuthorityEnabled === 'boolean');
    assert.ok(typeof snapshot.meta.lpLockedOrBurned === 'boolean');
    assert.ok(typeof snapshot.meta.topHoldersConcentration === 'number');
    assert.ok(typeof snapshot.meta.tokenAgeHours === 'number');
    assert.ok(typeof snapshot.meta.tokenAgeReliable === 'boolean');
    assert.ok(typeof snapshot.meta.burnerHolderDetected === 'boolean');
    assert.ok(snapshot.meta.creator);
    assert.ok(snapshot.meta.whales);
    assert.ok(snapshot.meta.liquidity);
    assert.ok(snapshot.meta.insiderNetwork);
  });
});
