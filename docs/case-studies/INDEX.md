# NexusVeritas Case Studies

Real-world Solana token investigations using NexusVeritas behavioral risk engine.

## Statistics

| Metric | Count |
|--------|-------|
| Cases Analyzed | 7 |
| Operators Identified | 1 |
| Insider Networks Detected | 4 |
| Serial Deployers Found | 3 |
| CRITICAL Risk Profiles | 2 |

---

## Insider Networks

Coordinated wallet clusters funded by a common source.

| Case | Token | Score | Cluster | Coverage |
|------|-------|-------|---------|----------|
| [CASE_001](case-001-SV151D5.md) | SV151D5... | 20 MEDIUM | 5 wallets | 10% |
| [CASE_002](case-002-BGAED7f6.md) | BGAED7f6... | 35 MEDIUM | 4 wallets | 10% |
| [CASE_006](case-006-CXwQDqJzr.md) | CXwQDqJzr... | 35 MEDIUM | 3 wallets | 7% |

## High-Risk Concentration

Insider networks with majority supply control.

| Case | Token | Score | Coverage | Notes |
|------|-------|-------|----------|-------|
| [CASE_007](case-007-3suqBmsd.md) | 3suqBmsdtG... | 70 HIGH | **53%** | Strongest insider concentration |

## Serial Deployers

Creators with history of multiple token launches.

| Case | Token | Score | Tokens Created |
|------|-------|-------|----------------|
| [CASE_004](case-004-Wc8KRpZhc.md) | Wc8KRpZhc... | 85 CRITICAL | 10+ |
| [CASE_005](case-005-C5GuQ6ck.md) | C5GuQ6ck... | 55 MEDIUM | 28+ |

## Critical Multi-Signal

Tokens where multiple risk signals triggered simultaneously.

| Case | Token | Score | Signals |
|------|-------|-------|---------|
| [CASE_003](case-003-6KPM7gXt.md) | 6KPM7gXt... | 100 CRITICAL | 6 signals |

---

## Operator Intelligence

Known operators linked to multiple token deployments.

### Operator: AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51

| Field | Value |
|-------|-------|
| SOL Balance | ~733 SOL (~$110,000+) |
| Transactions | 1000+ |
| Status | Under observation |

**Linked Cases:**
- CASE_001 — SV151D5 (5 wallets, 10% supply)
- CASE_006 — CXwQDqJzr (3 wallets, 7% supply)

**Observed Pattern:** Systematic insider wallet cluster creation across multiple token launches.

See [../operators/operator-AgmLJBM.md](../operators/operator-AgmLJBM.md) for full profile.

---

## Observed Patterns

```
Insider Networks:      4
Serial Deployers:      3
LP Unlocked:           5
Whale >25%:            4
Low Liquidity:         4
Young Token (<6h):     2
```

See [../datasets/patterns.md](../datasets/patterns.md) for full statistics.

---

*All cases investigated with NexusVeritas v0.8.0 on Solana mainnet.*
*No AI-generated scores. Every signal derived from on-chain data.*
