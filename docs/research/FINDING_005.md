# Research Finding #005 — INFRASTRUCTURE_HUB False Positives from Exchange Funding

**Date:** 2026-06-12
**Status:** Confirmed

## Discovery

During similarity analysis, 10+ INFRASTRUCTURE_HUB wallets showed
99.7% similarity to a single INDUSTRIAL_DEPLOYER (C5XX49jo).

Investigation of 6LkGY852 (INFRASTRUCTURE_HUB) revealed:

```
Funding chain:
  Exchange (7FgpxepU, 76,103 SOL, concentration 0.04)
    ↓ 1,000 SOL withdrawal
  Intermediary (915c7t49)
    ↓ 1,000 SOL
  Deployer (6LkGY852) → 750 tokens today
```

## Root Cause

Classifier assigns INFRASTRUCTURE_HUB when:
  total_incoming_sol >= threshold (high SOL)
  funding_sources_count >= threshold (multiple sources)

But exchange withdrawals produce identical signals:
  Large SOL amounts from multiple exchange sub-wallets
  = False INFRASTRUCTURE_HUB classification

## Impact

Unknown number of INFRASTRUCTURE_HUB in DB are actually
INDUSTRIAL_DEPLOYER with exchange funding.

Current DB: 49 INFRASTRUCTURE_HUB — likely 30-40% are false positives.

## Fix Required

Before classifying as INFRASTRUCTURE_HUB:
  Check if top_funder is in knownServices.json
  If yes → reclassify as INDUSTRIAL_DEPLOYER (exchange-funded)
  If no  → keep INFRASTRUCTURE_HUB classification

New sub-archetype candidate:
  EXCHANGE_FUNDED_DEPLOYER
  = INDUSTRIAL_DEPLOYER + verified exchange funding

## Exchange Added to knownServices

  7FgpxepURgUrYzWfrbtq6bCEzXWxTRXvudEcznhyqiFE
  Label: Exchange/Custodian (76k SOL, concentration 0.04)
  Commit: 1db917d

## Related

  FINDING_003 — operator_class != token_risk
  CLUSTER_002_CANDIDATE — ATA false positive
  docs/signals/SIGNAL_ATA_INITIALIZATION.md