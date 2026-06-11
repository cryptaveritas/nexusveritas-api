# Research Finding #003 — Operator Risk ≠ Token Risk

**Date:** 2026-06-10
**Status:** Confirmed across 3 behavior profiles

## Discovery

After running behavior_profile v0 on three tokens:

| Case | tokens_created | token_risk | liq_usd |
|------|---------------|------------|---------|
| CASE-046 | 750 | HIGH | $3,236 |
| CASE-047 | 6   | HIGH | $0 |
| CASE-048 | 750 | LOW  | $287,269 |

## Key Finding

CASE-046 and CASE-048 share nearly identical operator profiles
(750 tokens, 3000 signatures, no visible funding)
but produce opposite token risk outcomes.

Conclusion: operator behavior and token risk are independent dimensions.

## Two-Dimensional Risk Model

  Token Risk   — holder concentration, liquidity, LP, mint/freeze authority
  Operator Risk — wallet factory, recycling loops, split init, cluster membership

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