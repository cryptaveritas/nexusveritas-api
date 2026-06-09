# NexusVeritas — Observed Behavioral Patterns

*Updated: June 2026 | Based on 35 investigations*

---

## Pattern Statistics

| Pattern | Occurrences | Cases |
|---------|-------------|-------|
| LP Unlocked | 20+ | Most CRITICAL cases |
| Serial Deployer | 10 | CASE_004,005,008,019,022,024,027,029,033,034,035 |
| Insider Network | 19 | See INDEX |
| Whale >80% | 12 | Multiple cases |
| Zero Liquidity | 7 | CASE_009,010,013,021,024,030,033 |
| Young Token <1h | 10 | Multiple cases |
| 7-wallet Cluster | 4 | CASE_014,029,033,035 |
| 8-wallet Cluster | 2 | CASE_008,016 |

---

## Launch Factory Pattern

**Definition:** A recurring launch structure observed across multiple independent tokens characterized by the simultaneous presence of:
- Serial deployer (20+ previous token launches)
- Small insider cluster (5-8 wallets, low coverage 3-10%)
- Young token (< 1 hour old)
- Unlocked LP
- Zero or near-zero liquidity

**Observed cases:** CASE_008, CASE_029, CASE_033, CASE_035

**Key insight:** Funding wallets differ across cases, suggesting this is not a single operator but a common operational template used by multiple independent actors.

**Significance:** The pattern suggests a standardized launch methodology — tokens are deployed with pre-funded insider wallets in place before public launch, using unlocked LP to allow immediate exit.

---

## Recurring Operator Pattern

**Definition:** Same funding wallet detected across multiple independent token launches.

**Observed cases:** Operator A — CASE_001, CASE_006, CASE_022

**Key insight:** One funding wallet (AgmLJBM...) linked to 3 separate tokens. This is the strongest evidence of systematic multi-token operation in the dataset.

---

## High-Coverage Insider Pattern

**Definition:** Insider cluster controlling >30% of total token supply.

**Observed cases:**

| Case | Coverage | Cluster |
|------|----------|---------|
| CASE_027 | 58% | 5 wallets |
| CASE_007 | 53% | 3 wallets |
| CASE_015 | 38% | 5 wallets |

**Key insight:** When insider coverage exceeds 30%, the cluster effectively controls token price action. Combined with unlocked LP, this enables coordinated exit at any time.

---

## Triple Authority Pattern

**Definition:** Mint authority + Freeze authority + LP unlocked simultaneously active.

**Observed cases:** CASE_026

**Key insight:** Operator retains full control — can mint unlimited supply, freeze any wallet, and withdraw liquidity at will. Maximum control profile.

---

## Serial Deployer Distribution

| Range | Cases |
|-------|-------|
| 6-20 tokens | CASE_013, CASE_019, CASE_024, CASE_031 |
| 21-50 tokens | CASE_005, CASE_022, CASE_034, CASE_035 |
| 51-80 tokens | CASE_008, CASE_027, CASE_029, CASE_033 |

**Key insight:** Serial deployers with 50+ token history are consistently combined with insider networks or extreme whale concentration — never found in isolation.

---

## Low-Risk Insider Pattern

**Definition:** Overall risk score LOW (0-19) but insider network detected.

**Observed cases:** CASE_017 (score 10, 4 wallets, 15%), CASE_018 (score 10, 3 wallets, 3%)

**Key insight:** Standard risk signals and insider network activity are not always correlated. Insider detection operates as an independent signal layer.

---

*All patterns derived from real on-chain investigations.*
*NexusVeritas v0.8.0 · Solana mainnet*
