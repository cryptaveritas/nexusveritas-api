# Operator Archetype: INDUSTRIAL_DEPLOYER

**Version:** v1
**Status:** Emerging — 2 observations (CASE-046, CASE-048)
**Confirmed:** 2026-06-10

## Definition

A creator wallet with extremely high deployment volume (750+ estimated tokens)
and no detectable funding pattern via TRANSFER-type transactions.
Not necessarily malicious — produces both HIGH and LOW risk tokens.

## Behavioral Signature

  operational.tokens_created:    750+
  operational.total_signatures:  3000+ (maxed out)
  structural.funding_sources:    0 (not via TRANSFER type)
  structural.wallet_age_days:    0-7
  behavioral.recycling_loop:     false
  behavioral.split_init_pattern: false

## Key Distinction from WALLET_FACTORY

  INDUSTRIAL_DEPLOYER: one persistent wallet, very high volume
  WALLET_FACTORY:      creates new wallets for each launch (CLUSTER_001)

## Token Risk Correlation

  Not predictive. Industrial deployers produce both HIGH and LOW risk tokens.
  Token risk must be evaluated independently.

## Observations

  CASE-046: 750 tokens, wallet_age=0, token_risk=HIGH ($3.2k liq, 82% whale)
  CASE-048: 750 tokens, wallet_age=4, token_risk=LOW ($287k liq, 3% whale)

## operator_risk Estimate

  Base: LOW-MEDIUM
  Rationale: high volume alone is not a risk signal.
  Elevated if combined with: whale concentration, wallet rotation, cluster membership.

## Open Questions

  1. Why no visible funding? Exchange withdrawals? Program-based funding?
  2. Is launch_frequency meaningful when days_active=0?
  3. Are these the same operator or different industrial deployers?