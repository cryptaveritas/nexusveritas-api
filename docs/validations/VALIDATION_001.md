# Validation #001 — WALLET_FACTORY Archetype

**Date:** 2026-06-10
**Status:** Passed
**Accuracy:** 8/8 (100%)

## Ground Truth

CLUSTER_001 — confirmed behavioral cluster (manual investigation)
See docs/clusters/CLUSTER_001.md

## Test Setup

Pipeline: profile_creator.js → operator_classify.js
Input: 8 known CLUSTER_001 creator wallet addresses
Expected output: WALLET_FACTORY for all 8

## Results

| Creator Wallet | Expected | Result | Confidence |
|----------------|----------|--------|------------|
| CTVF8GZH... | WALLET_FACTORY | WALLET_FACTORY | 1.0 ✅ |
| Ctj86t1M... | WALLET_FACTORY | WALLET_FACTORY | 1.0 ✅ |
| ENFSrQp5... | WALLET_FACTORY | WALLET_FACTORY | 1.0 ✅ |
| 2TX53ajR... | WALLET_FACTORY | WALLET_FACTORY | 1.0 ✅ |
| hQz4h2VJ... | WALLET_FACTORY | WALLET_FACTORY | 1.0 ✅ |
| 6eSP86sK... | WALLET_FACTORY | WALLET_FACTORY | 1.0 ✅ |
| 89Yvf4k1... | WALLET_FACTORY | WALLET_FACTORY | 1.0 ✅ |
| EknteZnW... | WALLET_FACTORY | WALLET_FACTORY | 1.0 ✅ |

**8/8 correct. Confidence 1.0 on all.**

## Signals Matched

  single_token_wallet    tokens_created <= 2
  minimal_activity       total_signatures <= 15
  fresh_wallet           wallet_age_days <= 1
  init_amount_0002       total_incoming_sol <= 0.005
  no_large_funding       total_incoming_sol < 1.0

## Significance

First validation of automatic operator archetype classification.
Demonstrates that behavior_profile → operator_classify pipeline
correctly identifies ground truth clusters without manual investigation.

## Archetype Status After Validation

| Archetype | Status | Evidence |
|-----------|--------|----------|
| CASUAL_CREATOR | Confirmed | CASE-047 |
| INDUSTRIAL_DEPLOYER | Confirmed | CASE-046, CASE-048 |
| WALLET_FACTORY | Confirmed | CLUSTER_001 × 8 |
| INFRASTRUCTURE_HUB | Candidate | ASTyfSima4 (CASE-047 funder) |

## Next Validations

  VALIDATION_002 — INFRASTRUCTURE_HUB (ASTyfSima4)
  VALIDATION_003 — Unknown archetype discovery
  VALIDATION_004 — INDUSTRIAL_DEPLOYER cross-validation