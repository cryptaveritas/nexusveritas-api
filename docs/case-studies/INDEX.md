# NexusVeritas Case Studies

Real-world Solana token investigations using NexusVeritas behavioral risk engine.

## Statistics

| Metric | Count |
|--------|-------|
| Cases Analyzed | 10 |
| Operators Identified | 2 |
| Insider Networks Detected | 5 |
| Serial Deployers Found | 4 |
| CRITICAL Risk Profiles | 6 |

---

## Insider Networks

Coordinated wallet clusters funded by a common source.

| Case | Token | Score | Cluster | Coverage |
|------|-------|-------|---------|----------|
| [CASE_001](case-001-SV151D5.md) | SV151D5... | 20 MEDIUM | 5 wallets | 10% |
| [CASE_002](case-002-BGAED7f6.md) | BGAED7f6... | 35 MEDIUM | 4 wallets | 10% |
| [CASE_006](case-006-CXwQDqJzr.md) | CXwQDqJzr... | 35 MEDIUM | 3 wallets | 7% |
| [CASE_008](case-008-SPARxAFU.md) | SPARxAFU... | 95 CRITICAL | **8 wallets** ← record | 14% |

## High-Risk Concentration

Insider networks with majority supply control.

| Case | Token | Score | Coverage | Notes |
|------|-------|-------|----------|-------|
| [CASE_007](case-007-3suqBmsd.md) | 3suqBmsdtG... | 70 HIGH | **53%** | Insider controls majority |

## Serial Deployers

Creators with history of multiple token launches.

| Case | Token | Score | Tokens |
|------|-------|-------|--------|
| [CASE_005](case-005-C5GuQ6ck.md) | C5GuQ6ck... | 55 MEDIUM | 28+ |
| [CASE_004](case-004-Wc8KRpZhc.md) | Wc8KRpZhc... | 85 CRITICAL | 10+ |
| [CASE_008](case-008-SPARxAFU.md) | SPARxAFU... | 95 CRITICAL | **70+** ← record |

## Extreme Whale Dominance

Single wallets controlling majority of supply.

| Case | Token | Score | Whale % | Liquidity |
|------|-------|-------|---------|-----------|
| [CASE_009](case-009-2jXcdw23.md) | 2jXcdw23... | 100 CRITICAL | **99%** | $0 |
| [CASE_010](case-010-2WoyrRke.md) | 2WoyrRke... | 85 CRITICAL | 69% | $3,738 |

## Critical Multi-Signal

Tokens where 5+ risk signals triggered simultaneously.

| Case | Token | Score | Signals |
|------|-------|-------|---------|
| [CASE_003](case-003-6KPM7gXt.md) | 6KPM7gXt... | 100 CRITICAL | 6 signals |
| [CASE_009](case-009-2jXcdw23.md) | 2jXcdw23... | 100 CRITICAL | 6 signals |

---

## Operator Intelligence

Known operators linked to multiple token deployments.

### Operator A: AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51
- SOL Balance: ~733 SOL
- Linked: CASE_001, CASE_006
- Pattern: Insider network creation across multiple tokens

### Operator B: 9N8NvuM1GsXky7RPTJzmFdtSbBJyksymzMPjaCxwxdYC
- Linked: CASE_008
- Pattern: 70+ token serial deployer + 8-wallet insider cluster

See [../operators/](../operators/) for full operator profiles.

---

## Observed Patterns

```
Insider Networks:      5
Serial Deployers:      4
LP Unlocked:           7
Whale >50%:            3
Low/Zero Liquidity:    5
Young Token (<1h):     1
```

---

*All cases investigated with NexusVeritas v0.8.0 on Solana mainnet.*
*No AI-generated scores. Every signal derived from on-chain data.*
