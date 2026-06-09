# NexusVeritas Case Studies

Real-world Solana token investigations using NexusVeritas behavioral risk engine.

## Statistics

| Metric | Count |
|--------|-------|
| Cases Analyzed | 29 |
| Operators Identified | 7 |
| Recurring Operators | 1 |
| Insider Networks Detected | 16 |
| Serial Deployers Found | 8 |
| CRITICAL Risk Profiles | 15 |

## Records

```
Largest Insider Coverage:   58% supply        (CASE_027) ← NEW RECORD
Largest Insider Cluster:    8 wallets         (CASE_008, CASE_016)
Most Active Serial Deployer: 77+ tokens       (CASE_029)
Largest Whale Position:     100% supply       (CASE_021)
Most Signals Triggered:     7 simultaneously  (CASE_013, CASE_021)
Most Tokens per Operator:   3 tokens          (Operator A)
```

---

## Known Recurring Operators

### Operator A — AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51
- **3 tokens** — CASE_001, CASE_006, CASE_022
- 733 SOL balance · insider cluster creation · 47+ deployments

---

## Insider Networks

| Case | Token | Score | Cluster | Coverage |
|------|-------|-------|---------|----------|
| [CASE_001](case-001-SV151D5.md) | SV151D5... | 20 MEDIUM | 5 wallets | 10% |
| [CASE_002](case-002-BGAED7f6.md) | BGAED7f6... | 35 MEDIUM | 4 wallets | 10% |
| [CASE_006](case-006-CXwQDqJzr.md) | CXwQDqJzr... | 35 MEDIUM | 3 wallets | 7% |
| [CASE_007](case-007-3suqBmsd.md) | 3suqBmsdtG... | 70 HIGH | 3 wallets | 53% |
| [CASE_008](case-008-SPARxAFU.md) | SPARxAFU... | 95 CRITICAL | **8 wallets** | 14% |
| [CASE_011](case-011-9Kqf3LeU.md) | 9Kqf3LeU... | 20 MEDIUM | 4 wallets | 5% |
| [CASE_014](case-014-5rkRr4Fs.md) | 5rkRr4Fs... | 35 MEDIUM | 7 wallets | 7% |
| [CASE_015](case-015-oCToFrqz.md) | oCToFrqz... | 60 HIGH | 5 wallets | 38% |
| [CASE_016](case-016-GD3sA83p.md) | GD3sA83p... | 70 HIGH | **8 wallets** | 7% |
| [CASE_017](case-017-PAYmo6mo.md) | PAYmo6mo... | 10 LOW | 4 wallets | 15% |
| [CASE_018](case-018-EkDGB5fb.md) | EkDGB5fb... | 10 LOW | 3 wallets | 3% |
| [CASE_022](case-022-DBYp1sxG.md) | DBYp1sxG... | 55 MEDIUM | 4 wallets | 9% |
| [CASE_023](case-023-oreoU2P8.md) | oreoU2P8... | 45 MEDIUM | 5 wallets | 14% |
| [CASE_027](case-027-3jTwRtn7.md) | 3jTwRtn7... | 90 CRITICAL | 5 wallets | **58%** ← record |
| [CASE_028](case-028-W21AjqS2.md) | W21AjqS2... | 85 CRITICAL | 3 wallets | 12% |
| [CASE_029](case-029-BMvHHwX8.md) | BMvHHwX8... | 85 CRITICAL | 7 wallets | 6% |

## Serial Deployers

| Case | Token | Score | Tokens |
|------|-------|-------|--------|
| [CASE_029](case-029-BMvHHwX8.md) | BMvHHwX8... | 85 CRITICAL | **77+** ← record |
| [CASE_008](case-008-SPARxAFU.md) | SPARxAFU... | 95 CRITICAL | 70+ |
| [CASE_027](case-027-3jTwRtn7.md) | 3jTwRtn7... | 90 CRITICAL | 54+ |
| [CASE_022](case-022-DBYp1sxG.md) | DBYp1sxG... | 55 MEDIUM | 47+ |
| [CASE_005](case-005-C5GuQ6ck.md) | C5GuQ6ck... | 55 MEDIUM | 28+ |
| [CASE_019](case-019-EvTV19tK.md) | EvTV19tK... | 100 CRITICAL | 16+ |
| [CASE_024](case-024-Cz1aFM3U.md) | Cz1aFM3U... | 100 CRITICAL | 33+ |
| [CASE_004](case-004-Wc8KRpZhc.md) | Wc8KRpZhc... | 85 CRITICAL | 10+ |

## Triple Authority Risk

| Case | Token | Score | Mint | Freeze | LP |
|------|-------|-------|------|--------|----|
| [CASE_026](case-026-GozPNCAs.md) | GozPNCAs... | 90 CRITICAL | ✓ | ✓ | ✓ |

## Extreme Whale Dominance

| Case | Token | Score | Whale % | Liquidity |
|------|-------|-------|---------|-----------|
| [CASE_021](case-021-FIRE.md) | $FIRE | 100 CRITICAL | **100%** | $0 |
| [CASE_009](case-009-2jXcdw23.md) | 2jXcdw23... | 100 CRITICAL | 99% | $0 |
| [CASE_028](case-028-W21AjqS2.md) | W21AjqS2... | 85 CRITICAL | 77% | $14,092 |
| [CASE_010](case-010-2WoyrRke.md) | 2WoyrRke... | 85 CRITICAL | 69% | $3,738 |

## Social Engineering

| Case | Token | Narrative | Reality |
|------|-------|-----------|---------|
| [CASE_021](case-021-FIRE.md) | $FIRE | "30% charity for tree planting" | 100% supply one wallet, $0 liquidity |

---

## All Operators

| Operator | Tokens | Pattern | Status |
|----------|--------|---------|--------|
| [Op. A](../operators/operator-AgmLJBM.md) | **3** | Recurring — CASE_001, 006, 022 | **Recurring** |
| [Op. B](../operators/operator-9N8NvuM1.md) | 1 | 70+ tokens, 8-wallet cluster | Under observation |
| [Op. C](../operators/operator-DCVXmYyd.md) | 1 | 4-wallet cluster | Under observation |
| [Op. D](../operators/operator-EV4pfgCo.md) | 1 | 7-wallet cluster | Under observation |
| [Op. E](../operators/operator-6ps9Zn4p.md) | 1 | 5 wallets, 38% coverage | Under observation |
| [Op. F](../operators/operator-8y26AztwD.md) | 1 | 8-wallet cluster | Under observation |
| [Op. G](../operators/operator-HBUh9g46.md) | 1 | 5 wallets + mint authority | Under observation |

---

## Observed Patterns

```
Insider Networks:      16
Serial Deployers:      8
LP Unlocked:           16
Whale >50%:            7
Zero Liquidity:        6
Triple Authority:      1
Recurring Operators:   1 (3 tokens)
Social Engineering:    1
```

---

*All cases investigated with NexusVeritas v0.8.0 on Solana mainnet.*
*No AI-generated scores. Every signal derived from on-chain data.*
