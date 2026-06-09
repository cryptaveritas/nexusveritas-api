# NexusVeritas Case Studies

Real-world Solana token investigations using NexusVeritas behavioral risk engine.

## Statistics

| Metric | Count |
|--------|-------|
| Cases Analyzed | 12 |
| Operators Identified | 3 |
| Insider Networks Detected | 6 |
| Serial Deployers Found | 4 |
| CRITICAL Risk Profiles | 7 |

---

## Insider Networks

Coordinated wallet clusters funded by a common source.

| Case | Token | Score | Cluster | Coverage |
|------|-------|-------|---------|----------|
| [CASE_001](case-001-SV151D5.md) | SV151D5... | 20 MEDIUM | 5 wallets | 10% |
| [CASE_002](case-002-BGAED7f6.md) | BGAED7f6... | 35 MEDIUM | 4 wallets | 10% |
| [CASE_006](case-006-CXwQDqJzr.md) | CXwQDqJzr... | 35 MEDIUM | 3 wallets | 7% |
| [CASE_007](case-007-3suqBmsd.md) | 3suqBmsdtG... | 70 HIGH | 3 wallets | **53%** |
| [CASE_008](case-008-SPARxAFU.md) | SPARxAFU... | 95 CRITICAL | **8 wallets** ← record | 14% |
| [CASE_011](case-011-9Kqf3LeU.md) | 9Kqf3LeU... | 20 MEDIUM | 4 wallets | 5% |

## Serial Deployers

Creators with history of multiple token launches.

| Case | Token | Score | Tokens |
|------|-------|-------|--------|
| [CASE_005](case-005-C5GuQ6ck.md) | C5GuQ6ck... | 55 MEDIUM | 28+ |
| [CASE_004](case-004-Wc8KRpZhc.md) | Wc8KRpZhc... | 85 CRITICAL | 10+ |
| [CASE_008](case-008-SPARxAFU.md) | SPARxAFU... | 95 CRITICAL | **70+** ← record |
| [CASE_013](case-013-NQhrMnDm.md) | NQhrMnDm... | 100 CRITICAL | 6+ |

## Extreme Whale Dominance

| Case | Token | Score | Whale % | Liquidity |
|------|-------|-------|---------|-----------|
| [CASE_009](case-009-2jXcdw23.md) | 2jXcdw23... | 100 CRITICAL | **99%** | $0 |
| [CASE_010](case-010-2WoyrRke.md) | 2WoyrRke... | 85 CRITICAL | 69% | $3,738 |
| [CASE_013](case-013-NQhrMnDm.md) | NQhrMnDm... | 100 CRITICAL | 67% | $0 |

## Critical Multi-Signal

| Case | Token | Score | Signals |
|------|-------|-------|---------|
| [CASE_003](case-003-6KPM7gXt.md) | 6KPM7gXt... | 100 CRITICAL | 6 signals |
| [CASE_009](case-009-2jXcdw23.md) | 2jXcdw23... | 100 CRITICAL | 6 signals |
| [CASE_013](case-013-NQhrMnDm.md) | NQhrMnDm... | 100 CRITICAL | 7 signals |

---

## Operator Intelligence

| Operator | Cases | Pattern | Status |
|----------|-------|---------|--------|
| [Operator A](../operators/operator-AgmLJBM.md) — AgmLJBM... | CASE_001, CASE_006 | Insider networks, 733 SOL | Under observation |
| [Operator B](../operators/operator-9N8NvuM1.md) — 9N8NvuM1... | CASE_008 | 70+ tokens, 8-wallet cluster | Under observation |
| [Operator C](../operators/operator-DCVXmYyd.md) — DCVXmYyd... | CASE_011 | New operator, 4-wallet cluster | Under observation |

---

## Observed Patterns

```
Insider Networks:      6
Serial Deployers:      4
LP Unlocked:           8
Whale >50%:            4
Zero Liquidity:        4
Young Token (<6h):     3
```

---

*All cases investigated with NexusVeritas v0.8.0 on Solana mainnet.*
*No AI-generated scores. Every signal derived from on-chain data.*
