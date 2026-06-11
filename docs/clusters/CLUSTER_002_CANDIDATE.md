# CLUSTER_002 — CANDIDATE

**Status:** Under Investigation
**Confidence:** Medium
**Date:** 2026-06-11
**Discovered via:** shared funder between PROFESSIONAL_CREATOR profiles

## Core Entity

**Hub wallet:** GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE

## Observed Signals

  141 unique recipients in one day (2026-06-11)
  High-value capital distribution (60, 34, 20, 15 SOL)
  12× micro-payments of 0.002 SOL (wallet initialization pattern)
  Direct funding of two PROFESSIONAL_CREATOR profiles:
    6tgQUC6W (0.982 SOL, May 28)
    FKJjbHZa (1.288 SOL, June 4)

## HYPOTHESIS_001

GJRs4FwH may represent shared operational infrastructure
used by multiple creator archetypes simultaneously.

Observed dual behavior:
  1. Capital distribution hub (large SOL payments)
  2. Wallet factory initialization (0.002 SOL × 12)

If confirmed: first entity observed serving both roles.

## Next Validation Steps

1. Trace all 12 micro-funded wallets (0.002 SOL recipients)
   - Did they create tokens?
   - Do they match known WALLET_FACTORY pattern?

2. Check large recipients (60, 34, 20 SOL)
   - Are they operator wallets in the DB?
   - Do they match PROFESSIONAL_CREATOR pattern?

3. Look for chain:
   GJRs4FwH → 0.002 SOL → wallet → creator → token launch

## Micro-funded Wallets (0.002 SOL) — To Investigate

  9jRW358G5Cjfm3HxZw2ZgZ1PKT9rat68J2oQsHP1XMfh
  2icJhwhcZdmEzAGujoZtAeL67nW1Dn5NPmW9bBuu9uVt
  G3D6HuK7MDCfaVJPU6xbZ5CGsSrJT4ynSQTzrEBwgTtD
  5HSMmABdFRBPsWxN3HnAGS4TWtPRZBF2SxvVcCWiohf3
  EX3cSXAKRuAF3vCRbEsh9WJBP6nAMrjcFzEnccHRjKnJ
  BAf3eXG3UwMvv4kLrLKiPGegnEbqX64RsAmED7EJ8pF3
  8RguDfyQmjbyFKSzwP6NemtNSyJeDEp6XgrgharNCp88
  GhD1pdRSK5wHmqhMyPx8ToeDEqNoVFBszBzfc2cUYhpf
  6oYVqKa5mEg2tLeEk66F7rai21gEeLeKY9kcKYB2zqp5
  2yAEH8otaosXZrpX3i4aq99pfYA2RZB4h6sSVgMK9xaB
  9DUFYC5U6guXgRWJjVsJVPUj2dkyeVvD2exhWtC4spSD
  HRhy3JAaQ5rU35A6nUesrNFnszWjN5nVHgHtKa8xf3ZG

## Related

  CLUSTER_001 (confirmed) — different pattern, same era
  FINDING_003 — operator_class != token_risk
  PROFESSIONAL_CREATOR archetype