# Research Finding #002 — Split Initialization Funding Pattern

**Date:** 2026-06-10
**Token:** 2SahEeixDPartmSoRmdUS58F9CNt2VLe54epYZCipump
**Status:** Single observation — hypothesis only

## Observed Pattern

Creator wallet received initialization funding split across two wallets:
  Funder A (4MwJahKs...) -> 0.001 SOL -> Creator
  Funder B (FFFSaHpG...) -> 0.001 SOL -> Creator
  Total: 0.002 SOL (standard account initialization amount)

Both funder wallets:
  - Single purpose (1 outgoing transaction each)
  - No incoming transfers detected
  - Created same day (2026-06-10)

## Strongest Signal Combination

  wallet_age_days: 0       fresh creator wallet
  creator_tokens: 250+     serial deployer
  init_funding: 0.002 SOL  standard init amount
  funder_count: 2          split across two wallets
  single_purpose_funders: true

wallet_age=0 combined with creator_tokens=250+ is the primary signal.
Suggests wallet rotation or creator address cycling.

## Comparison with CLUSTER_001

  CLUSTER_001:  1 funder x 0.002 SOL -> creator
  This case:    2 funders x 0.001 SOL -> creator

Same total amount, different structure.
Single observation — no conclusion drawn.

## Proposed Signal Group: Funding Initialization Patterns

  init_funding_amount: 0.002
  init_funder_count: 2
  split_init_pattern: true
  single_purpose_funders: true

Future variants to watch:
  4 funders x 0.0005 SOL
  5 funders x 0.0004 SOL

## Status

Needs 5+ independent observations before adding as scored signal.
See docs/FINGERPRINT_ENGINE.md for signal taxonomy.