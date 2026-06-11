# Research Finding #004 — Operator Archetypes Stable Across Token Risk Profiles

**Date:** 2026-06-10
**Status:** First practical validation

## Discovery

First automated classification run on 3 behavior profiles.

| Case | Operator Class | Confidence | Token Risk |
|------|---------------|------------|------------|
| CASE-046 | INDUSTRIAL_DEPLOYER | 1.0 | HIGH |
| CASE-047 | CASUAL_CREATOR | 1.0 | HIGH |
| CASE-048 | INDUSTRIAL_DEPLOYER | 1.0 | LOW |

## Key Finding

CASE-046 and CASE-048 both classify as INDUSTRIAL_DEPLOYER with
maximum confidence (1.0), despite opposite token risk outcomes.

Operator archetypes remain stable regardless of token risk.
This validates FINDING_003 in practice.

## Significance

This is the first time NexusVeritas produced an automatic classification:

  Behavior Profile -> Operator Classifier -> Operator Archetype

Without manual investigation.

## What Changed

Before: operator attribution required manual chain analysis
After:  operator_classify.js produces archetype automatically

## Next Validation

Run classifier on CLUSTER_001 creator wallets.
Expected: WALLET_FACTORY classification.
If confirmed: classifier generalizes beyond initial training cases.

## Related

- docs/research/FINDING_003.md
- docs/fingerprints/INDUSTRIAL_DEPLOYER_V1.md
- operator_classify.js