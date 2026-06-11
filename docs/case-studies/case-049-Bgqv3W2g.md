# CASE-049 — Bgqv3W2g (pump.fun)

**Date:** 2026-06-10
**Token:** Bgqv3W2gLUXXJGeNnP2F1yyd5xXfknVrhohKGdUVpump
**Chain:** Solana / pump.fun (bonding curve)
**Token Risk:** CRITICAL
**Operator Class:** CASUAL_CREATOR
**Research Role:** FINDING_003 validation — new quadrant

## Token Signals

| Signal | Value | Flag |
|--------|-------|------|
| Largest Holder | 93% | 🔴 Extreme |
| Top 3 Holders | 96% | 🔴 Extreme |
| Top 10 Holders | 100% | 🔴 Extreme |
| Liquidity | $0 | 🔴 No pool |
| Token Age | 226h (9.4 days) | 🔴 Stale |
| LP Locked | No | 🟡 |
| Mint Authority | Disabled | ✅ |
| Freeze Authority | Disabled | ✅ |
| Insider Network | Not detected | ✅ |

## Creator Profile

**Address:** 6hkoUXi1SJM63D5MipLrLXQomP84qifSUj8xx1MpxtVW
**Operator Class:** CASUAL_CREATOR (confidence: 1.0)
**Tokens Created:** 8

## Assessment

Abandoned or stale token. Created 9+ days ago, never graduated
from pump.fun bonding curve. 93% supply held by single wallet
(likely creator). No trading activity, no liquidity.

## Research Significance — FINDING_003 Validation

This case adds a new quadrant to the two-dimensional risk matrix:

| Operator Class | Token Risk | Case |
|----------------|------------|------|
| INDUSTRIAL_DEPLOYER | LOW | CASE-048 |
| INDUSTRIAL_DEPLOYER | HIGH | CASE-046 |
| CASUAL_CREATOR | HIGH | CASE-047 |
| CASUAL_CREATOR | CRITICAL | CASE-049 ← new |

**Key finding:**
High token risk does not imply operator sophistication.

This CRITICAL token was created by a CASUAL_CREATOR (8 total tokens).
No wallet factory. No rotation infrastructure. No serial deployer.
Just a simple abandoned token with extreme concentration.

## Implications for NexusVeritas

  Token Risk answers:        "How dangerous is this token?"
  Operator Intelligence answers: "Who is behind it and how sophisticated are they?"

These are independent questions requiring independent analysis.
Rugcheck, DexScreener, and similar tools answer only the first.
NexusVeritas answers both.

## Related

- docs/research/FINDING_003.md
- docs/validations/VALIDATION_001.md
- CASE-046, CASE-047, CASE-048 (operator archetype comparison)