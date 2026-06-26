# Operator Cluster Validation — NexusVeritas

**Date:** 2026-06-26
**Status:** In progress (3 of 15 clusters reviewed)

---

## CL-003 — VALIDATED (HIGH confidence)

**Funder:** 7EYgVUTxtRkVkhGaojaBLMHVYtfRXT1Xw7b11tY9sAHu
**Wallets:** 8 | **Unique days:** 1

**Archetype distribution (after reclassification):**
| Archetype | Count | tokens_created | days_active |
|---|---|---|---|
| INDUSTRIAL_DEPLOYER | 8 | 2500 (all) | 4-21 |

**Verdict: CONFIRMED CLUSTER**
- All 8 wallets funded by same source on same day
- All classified INDUSTRIAL_DEPLOYER with identical token count (2500 = Dune cap)
- Identical behavioral profile across all wallets
- Previously validated as CLUSTER_001 (8/8 WALLET_FACTORY in earlier classifier)
- Note: archetype changed WALLET_FACTORY→INDUSTRIAL_DEPLOYER after classifier upgrade
  (tokens_created=2500 pushes above WALLET_FACTORY threshold)
- This is a classifier boundary issue, not a cluster validity issue

**Confidence: HIGH**

---

## CL-005 — VALIDATED (HIGH confidence)

**Funder:** AMqz7dDJP1MfAQt2iSNa6q2vDH4gcHYAFPksaSpgKXuS
**Wallets:** 7 | **Unique days:** 1

**Archetype distribution:**
| Archetype | Count | tokens_created | days_active |
|---|---|---|---|
| EXCHANGE_FUNDED_DEPLOYER | 7 | 2500 (all) | 1 (all) |

**Verdict: CONFIRMED CLUSTER — STRONG SIGNAL**
- 7 wallets, all funded same day, all created same day
- All classified EXCHANGE_FUNDED_DEPLOYER with identical profile
- days_active=1 for ALL wallets -- extreme coordination signal
- tokens_created=2500 (Dune cap) -- likely much higher in reality
- This is the strongest cluster found: 7 identical wallets, 1 day, 1 funder

**Confidence: HIGH (strongest in dataset)**

---

## CL-001 — REVIEW (MEDIUM confidence)

**Funder:** 5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9
**Wallets:** 11 | **Unique days:** 11

**Archetype distribution:**
| Archetype | Count | days_active range | tokens range |
|---|---|---|---|
| HIGH_FREQ_LOW_CONTEXT | 6 | 10-636 | 6-681 |
| INDUSTRIAL_DEPLOYER | 2 | 195-652 | 2186-2500 |
| WALLET_FACTORY | 2 | 0 | 0 |
| CASUAL_CREATOR | 1 | 29 | 3 |

**Verdict: AMBIGUOUS — requires manual on-chain review**
- 4 different archetypes in one cluster = heterogeneous group
- Could be: legitimate team with different members at different experience levels
- Could be: infrastructure hub serving multiple operators
- WALLET_FACTORY entries with 0 tokens/0 days suggest unused wallets
- 11 unique days suggests slower rollout, not coordinated same-day creation
- Funded over 2025-09-25 to 2026-06-02 (9 months) -- very long window

**Confidence: LOW-MEDIUM**
**Recommended action:** manual on-chain review of funder 5tzFkiKscXHK...

---

## Summary

| Cluster | Verdict | Confidence | Notes |
|---|---|---|---|
| CL-003 | CONFIRMED | HIGH | INDUSTRIAL_DEPLOYER factory, identical profiles |
| CL-005 | CONFIRMED | HIGH | EXCHANGE_FUNDED, strongest coordination signal |
| CL-001 | AMBIGUOUS | LOW-MEDIUM | Heterogeneous archetypes, 9-month window |
| CL-002 to CL-015 | PENDING | -- | Manual review needed |

**Validated precision: 2/2 HIGH clusters confirmed (100%, n=2)**

---

## Key Finding from Validation

HIGH confidence clusters (unique_days=1) show much stronger internal consistency
than MEDIUM clusters. All wallets in HIGH clusters share:
- Same archetype
- Same tokens_created value
- Same or very similar days_active

MEDIUM clusters are more heterogeneous and require additional signals.

**Recommendation:** Focus cluster detection on HIGH confidence (unique_days=1) for
initial Operator Registry. MEDIUM clusters should be flagged as "candidate" only.

---

## Classifier Boundary Note

CL-003 was previously documented as WALLET_FACTORY (CLUSTER_001).
After classifier upgrade, same wallets now classify as INDUSTRIAL_DEPLOYER
because tokens_created=2500 exceeds WALLET_FACTORY threshold.

This highlights the need for cluster identity to be stable regardless of
archetype changes. cluster_id (CL-003) remains valid even if archetype changes.
