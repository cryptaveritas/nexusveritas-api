# NexusVeritas Research Report #2

**The Rise of Recurring Operators**

*Published: June 2026*
*Engine: NexusVeritas v0.8.0*
*Cases Analyzed: 42*

---

## Executive Summary

This report documents findings from 42 real-world Solana token investigations — double the dataset of Research Report #1. The central finding is not about individual tokens.

It is about the people behind them.

After 42 investigations, a clear pattern emerged: the same operators appear repeatedly across independent token launches. One funding wallet (Operator A) was confirmed across 4 separate tokens. Seven operator profiles were identified in total. Insider wallet clusters — coordinated groups of wallets funded from a common source — were detected in 22+ cases, with coverage ranging from 3% to 74% of total token supply.

**The strongest signal was not unlocked liquidity, whale ownership, or concentration. It was the repeated appearance of the same operators across unrelated token launches.**

This is what distinguishes NexusVeritas from conventional token scanners. While most tools analyze tokens, NexusVeritas tracks the behavioral patterns of the people behind them.

---

## Research Dataset

| Metric | Report #1 (20 cases) | Report #2 (42 cases) |
|--------|---------------------|---------------------|
| Cases Analyzed | 20 | 42 |
| Operators Identified | 6 | 7 |
| Recurring Operators | 1 | 1 (4 linked launches) |
| Insider Networks | 11 | 22+ |
| CRITICAL Profiles | 9 | 18+ |
| Coverage Record | 53% | 74% |
| Serial Deployer Record | 70+ tokens | 77+ tokens |

---

## Recurring Operators

### The Core Finding

Most blockchain security tools treat each token as an independent event. NexusVeritas tracks the funding relationships between wallets — and after 42 cases, one operator appeared four times.

### Operator A

**Wallet:** AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51

**Balance:** ~733 SOL | **Transactions:** 1000+

| Case | Token | Score | Cluster | Coverage |
|------|-------|-------|---------|----------|
| CASE_001 | SV151D5... | 20 MEDIUM | 5 wallets | 10% |
| CASE_006 | CXwQDqJzr... | 35 MEDIUM | 3 wallets | 7% |
| CASE_022 | DBYp1sxG... | 55 MEDIUM | 4 wallets | 9% |
| CASE_036 | dekNoN3D... | 45 MEDIUM | 3 wallets | 5% |

**Key observation:** All four tokens scored MEDIUM — not CRITICAL. This suggests the operator deliberately uses smaller clusters and lower coverage to avoid triggering high-risk flags in conventional scanners. The pattern would be completely invisible without cross-token behavioral analysis.

---

## Insider Network Analysis

### 22+ Networks Detected Across 42 Cases

Insider networks — coordinated wallet clusters where 3+ holders share a common funding source — were detected in more than half of all investigations.

### Cluster Size Distribution

| Cluster Size | Cases | % of Insider Cases |
|-------------|-------|-------------------|
| 3 wallets | 7 | 32% |
| 4 wallets | 5 | 23% |
| 5 wallets | 4 | 18% |
| 7 wallets | 4 | 18% |
| 8 wallets | 3 | 14% |

**The 8-wallet cluster appeared three times** (CASE_008, CASE_016, CASE_037) — across different funding wallets. This strongly suggests 8 wallets represents a preferred operational scale, not coincidence.

### Coverage Records

| Case | Coverage | Cluster | Score |
|------|----------|---------|-------|
| CASE_038 | **74%** ← record | 4 wallets | 35 MEDIUM |
| CASE_027 | 58% | 5 wallets | 90 CRITICAL |
| CASE_007 | 53% | 3 wallets | 70 HIGH |
| CASE_015 | 38% | 5 wallets | 60 HIGH |

**Critical finding:** The record case (74% coverage, 4 wallets) scored only MEDIUM (35). A conventional scanner would not flag this token as dangerous. The insider cluster controlled nearly three-quarters of the total supply.

### Low-Risk Tokens With Active Insider Networks

| Case | Score | Coverage | Notes |
|------|-------|----------|-------|
| CASE_017 | 10 LOW | 15% | 4 wallets |
| CASE_018 | 10 LOW | 3% | 3 wallets |
| CASE_038 | 35 MEDIUM | 74% | 4 wallets — record |
| CASE_040 | 35 MEDIUM | 26% | 4 wallets |
| CASE_041 | 25 MEDIUM | 24% | 3 wallets |

**Insider detection and overall risk score are not correlated.** A token can score LOW while still containing a coordinated insider cluster controlling significant supply.

---

## Serial Deployer Ecosystem

### Top Serial Deployers Found

| Case | Deployments | Combined Signals |
|------|-------------|-----------------|
| CASE_029, CASE_033 | **77+** | + 7-wallet cluster |
| CASE_027 | 54+ | + 5-wallet cluster, 58% coverage |
| CASE_035 | 51+ | + 7-wallet cluster |
| CASE_034 | 49+ | + whale 81%, young token |
| CASE_024, CASE_031 | 33-34+ | + concentration 98-99% |

**No serial deployer was found in isolation.** Every case with a serial deployer was accompanied by at least one additional major risk signal — typically young token age, extreme concentration, or an insider cluster.

### The Launch Factory Pattern

Across multiple cases, a recurring launch structure emerged:

```
Serial deployer (20+ launches)
+ Insider cluster (5-8 wallets, 3-10% coverage)
+ Young token (< 1 hour old)
+ Unlocked LP
+ Zero or near-zero liquidity
```

This pattern appeared in CASE_008, CASE_029, CASE_033, CASE_035 — with different funding wallets each time. The consistent structure across independent operators suggests this is a standardized launch methodology, not isolated behavior.

---

## Key Findings

**1. Recurring operators exist and can be identified.**
Operator A was confirmed across 4 independent launches using behavioral wallet analysis. This is impossible to detect with token-level analysis alone.

**2. The 8-wallet cluster is a recurring structure.**
Three independent cases (different operators, different tokens) all used exactly 8 wallets. This suggests a preferred operational scale across multiple actors.

**3. High insider coverage can coexist with low risk scores.**
CASE_038 (74% coverage, 4 wallets) scored only 35 MEDIUM. Conventional scanners would not flag it. NexusVeritas detected it.

**4. Serial deployers always combine with other signals.**
No high-frequency deployer (20+ launches) was found without at least one additional major risk factor.

**5. The Launch Factory Pattern is a real behavioral template.**
Multiple independent operators use the same launch structure: serial deployer + small insider cluster + young token + unlocked LP. The consistency suggests shared knowledge or tooling.

**6. Operator A deliberately avoids CRITICAL thresholds.**
All 4 of Operator A's linked tokens scored MEDIUM. The operator appears to calibrate insider cluster size and coverage to stay below conventional detection thresholds.

---

## What We Learned After 42 Cases

The first 20 cases established that insider networks exist and can be detected.

The next 22 cases revealed something more important: **the people running these operations are not random. They have preferred structures, preferred scales, and in at least one case, they have been operating continuously across at least 4 separate token launches.**

The question is no longer whether coordinated behavior exists on Solana. It does. The question is: how many operators are there, and how many launches are they responsible for?

---

## Methodology Notes

**Coverage threshold:** Clusters with < 3% supply coverage are detected but not scored — suppresses noise from large-cap tokens where small clusters hold negligible supply.

**Insider detection:** Top 8 holders analyzed. Funding source identified via first incoming transaction. Known exchange/service wallets filtered via whitelist. Clusters where 3+ holders share a funding source are flagged.

**All scores deterministic.** No AI-generated scores. Every point attributed to a specific on-chain signal.

---

## Limitations

- Sample size (42) is sufficient for pattern identification, not statistical significance
- Coverage threshold may suppress real networks with dispersed holdings
- Operator A represents only confirmed recurring behavior — others may exist below detection threshold
- Token-level analysis only; smart contract audit not included

---

## Future Research

```
Priority 1: Track Operator A across additional launches
Priority 2: Identify additional recurring operators
Priority 3: GET /risk/creator — analyze operator history directly
Priority 4: Cross-token trust graph
Priority 5: Temporal analysis — when do operators typically launch?
```

---

*NexusVeritas is an open-source behavioral risk intelligence platform for Solana.*
*42 real-world investigations. 7 operators. 1 confirmed recurring.*
*github.com/cryptaveritas/nexusveritas-api*
*No AI-generated scores. Every signal derived from on-chain data.*
