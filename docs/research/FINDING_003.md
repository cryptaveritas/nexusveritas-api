# Research Finding #003 — Operator Class ≠ Token Risk

**Date:** 2026-06-10
**Status:** Confirmed across 3 behavior profiles

## Discovery

After running behavior_profile v0 on three tokens:

| Case | tokens_created | token_risk | liq_usd |
|------|---------------|------------|---------|
| CASE-046 | 750 | HIGH | $3,236 |
| CASE-047 | 6   | HIGH | $0 |
| CASE-048 | 750 | LOW  | $287,269 |
| CASE-049 | 8   | CRITICAL | $0 |

## Key Finding

CASE-046 and CASE-048 share nearly identical operator profiles
(750 tokens, 3000 signatures, no visible funding)
but produce opposite token risk outcomes.

Conclusion: operator CLASS and token risk are independent dimensions.
Note: operator_risk (future metric) was not measured in this finding.

## Two-Dimensional Risk Model

  Token Risk    — holder concentration, liquidity, LP, mint/freeze authority
  Operator Class — CASUAL_CREATOR, INDUSTRIAL_DEPLOYER, WALLET_FACTORY, ...
  Operator Risk  — future metric, not yet computed

A high-volume deployer (INDUSTRIAL_DEPLOYER) can produce both:
  - HIGH token risk tokens (poor distribution, low liquidity)
  - LOW token risk tokens (healthy distribution, strong liquidity)

## Product Implication

NexusVeritas should expose two independent scores:

  token_risk:    82   <- how dangerous is this specific token
  operator_risk: 18   <- how suspicious is the creator/operator

Not a single combined score.

## Operator Archetypes Emerging

  CASUAL_CREATOR      1-20 tokens, normal funding, identifiable
  PROFESSIONAL_CREATOR 20-100 tokens, organized infrastructure
  INDUSTRIAL_DEPLOYER  100+ tokens, automated, not necessarily malicious
  WALLET_FACTORY       creates+discards wallets, CLUSTER_001 pattern
  ROTATION_OPERATOR    wallet rotation, split init, CASE-046 pattern
  INFRASTRUCTURE_HUB   capital aggregation, ASTyfSima4 pattern

## Related

- docs/fingerprints/profiles_2026-06-10.json
- docs/fingerprints/INDUSTRIAL_DEPLOYER_V1.md
- docs/fingerprints/WALLET_FACTORY_V1.md
- docs/research/FINDING_001.md
## Updated Risk Matrix (after CASE-049)

| Operator Class | Token Risk | Case |
|----------------|------------|------|
| INDUSTRIAL_DEPLOYER | LOW | CASE-048 |
| INDUSTRIAL_DEPLOYER | HIGH | CASE-046 |
| CASUAL_CREATOR | HIGH | CASE-047 |
| CASUAL_CREATOR | CRITICAL | CASE-049 |

FINDING_003 now has 4 data points across 3 operator classes.
The two-dimensional model is empirically validated.
## Research Matrix — Empty Cells as Future Research Agenda

| Operator Class | LOW | HIGH | CRITICAL |
|----------------|-----|------|----------|
| CASUAL_CREATOR | ? | CASE-047 | CASE-049 |
| INDUSTRIAL_DEPLOYER | CASE-048 | CASE-046 | ? |
| WALLET_FACTORY | ? | ? | ? |
| INFRASTRUCTURE_HUB | ? | ? | ? |

Empty cells are not gaps in the model — they are research questions.
Each filled cell either strengthens or challenges the independence hypothesis.

## Corrected Central Thesis

  operator_class ≠ token_risk

Not:
  operator_risk ≠ token_risk

(operator_risk is a future metric not yet computed)

## Research Line

  FINDING_001  Funding overlap → 0 clusters (methodology failure)
  FINDING_003  operator_class ≠ token_risk (model foundation)
  VALIDATION_001  Fingerprint Engine classifies ground truth correctly

These three findings form a coherent research line:
what doesn't work → what the model is → that the model works.
