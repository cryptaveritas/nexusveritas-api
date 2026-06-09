# NexusVeritas Research Report #1

**Behavioral Risk Patterns on Solana**

*Published: June 2026*
*Engine: NexusVeritas v0.8.0*
*Cases Analyzed: 20*

---

## Executive Summary

This report documents findings from 20 real-world Solana token investigations using the NexusVeritas behavioral risk intelligence engine. Analysis focused on detecting coordinated wallet behavior, insider networks, serial deployment patterns, and whale concentration.

Key findings: traditional token risk indicators do not fully capture coordinated insider activity. NexusVeritas identified 11 insider wallet networks and 6+ distinct operators across 20 investigations. Eight-wallet clusters appeared in multiple independent cases, suggesting a preferred operational scale among sophisticated operators.

---

## Statistics

| Metric | Value |
|--------|-------|
| Cases Analyzed | 20 |
| Operators Identified | 6 |
| Insider Networks Detected | 11 |
| Serial Deployers Found | 4 |
| CRITICAL Risk Profiles | 9 |
| HIGH Risk Profiles | 4 |
| MEDIUM Risk Profiles | 5 |
| LOW With Insider Network | 2 |
| Recurring Operators | 1 |

---

## Key Findings

**1. Insider networks can exist in low-risk tokens.**
CASE_017 and CASE_018 both received LOW overall scores yet contained active insider networks. Insider network activity and general token risk are not always correlated.

**2. Multiple recurring operators were identified.**
Operator A was linked to two independent token launches (CASE_001, CASE_006) — suggesting systematic multi-token operation.

**3. Eight-wallet clusters appeared in multiple independent cases.**
CASE_008 and CASE_016 both contained 8-wallet clusters funded from different sources. This may represent a preferred operational scale.

**4. Insider coverage varied widely — from 3% to 53% of supply.**
High coverage (>30%) combined with LP unlocked represents the highest risk insider profile.

**5. Serial deployers always appeared with additional risk signals.**
No serial deployer case was found in isolation — all combined with at least one other factor.

**6. Extreme whale concentration (>90%) correlated with zero or near-zero liquidity.**
Suggesting pre-launch or abandoned setups rather than active markets.

**7. Coverage threshold suppresses noise from large-cap tokens.**
Clusters with < 3% coverage are detected but not scored — demonstrated in CASE_020 where a 3-wallet cluster existed but held negligible supply.

---

## Insider Network Analysis

### Cluster Size Distribution

| Cluster Size | Cases |
|-------------|-------|
| 3 wallets | 3 |
| 4 wallets | 3 |
| 5 wallets | 2 |
| 7 wallets | 2 |
| 8 wallets | 2 |

### Records
- Largest cluster: **8 wallets** (CASE_008, CASE_016)
- Highest coverage: **53% of supply** (CASE_007)
- Most signals triggered: **7 simultaneously** (CASE_013)
- Largest serial deployer: **70+ tokens** (CASE_008)
- Largest whale: **99% of supply** (CASE_009)

---

## Operator Intelligence

| Operator | Tokens | Pattern |
|----------|--------|---------|
| Op. A — AgmLJBM... | 2 tokens | **Recurring** — CASE_001, CASE_006 |
| Op. B — 9N8NvuM1... | 1 token | 70+ serial deployer + 8-wallet cluster |
| Op. C — DCVXmYyd... | 1 token | 4-wallet cluster |
| Op. D — EV4pfgCo... | 1 token | 7-wallet cluster |
| Op. E — 6ps9Zn4p... | 1 token | 5 wallets, 38% coverage |
| Op. F — 8y26Aztw... | 1 token | 8-wallet cluster |

**Recurring Operators:** 1 of 6 (Operator A — confirmed across 2 tokens)

---

## Notable Cases

**CASE_007** — 3 wallets controlling 53% of supply. Highest insider coverage documented.

**CASE_008** — 8-wallet cluster + 70+ token serial deployer + token < 1 hour old. Most aggressive coordinated launch pattern.

**CASE_009** — Single wallet controlling 99% of supply with zero liquidity.

**CASE_013** — 7 independent risk signals triggered simultaneously. Raw score 130, capped at 100.

**CASE_017** — Score: 10 (LOW). Yet 4 coordinated wallets control 15% of supply. Demonstrates independence of insider detection from general risk score.

---

## Methodology

**Signals analyzed:** Mint Authority, Freeze Authority, Holder Concentration, Token Age, Burner Wallet, Creator Analysis, Whale Dominance, Liquidity Analysis, Insider Network Detection.

**Insider Network Detection:**
1. Retrieve top 8 token holders
2. Identify funding source for each holder
3. Filter known exchange/service wallets
4. Detect clusters where 3+ holders share a funding source
5. Apply 3% minimum coverage threshold
6. Score: 3-4 wallets (+10), 5-7 wallets (+20), 8+ wallets (+30)

All scores are deterministic. No AI-generated scores. Every point attributed to a specific on-chain signal.

---

## Limitations

- Coverage threshold (3%) may suppress real insider networks with dispersed holdings
- Funding source detection uses first transaction — may not always reflect true funder
- Large-cap tokens may produce false positives without liquidity context
- Sample size (20) is sufficient for pattern identification but not statistical significance

---

## Future Work

```
v0.9  Risk Score History
v1.0  Early Dump Detection
v1.1  GET /risk/creator
v1.5  Trust Graph
```

---

*NexusVeritas is an open-source behavioral risk intelligence platform for Solana.*
*github.com/cryptaveritas/nexusveritas-api*
*No AI-generated scores. Every signal derived from on-chain data.*
