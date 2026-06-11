# Operator Archetype: WALLET_FACTORY

**Version:** v1
**Status:** Confirmed — CLUSTER_001 (2026-06-10)

## Definition

An operator that creates fresh creator wallets for each token launch.
Uses a central infrastructure loop to fund and manage the factory.
Each creator wallet: single-purpose, short-lived, exactly 0.002 SOL init.

## Behavioral Signature

  structural.wallet_age_days:        0-1 per creator wallet
  structural.funding_sources_count:  1-3 (feeder wallets)
  behavioral.total_incoming_sol:     ~0.002 SOL per wallet
  behavioral.transfer_count:         1-3 (single purpose)
  behavioral.recycling_loop:         true (feeder loop)
  operational.tokens_created:        1 per wallet

## Infrastructure Pattern

  Factory hub (3DDmb2kP...)
    ↕ SOL recycling loop
  Feeder wallet (ML1xEaEN...)
    ↓ 0.002 SOL × N per day
  Creator wallets (CTVF8GZH, Ctj86t1M, ...)
    ↓ 1 token each

## Key Distinction from INDUSTRIAL_DEPLOYER

  WALLET_FACTORY:      new wallet per launch, low per-wallet token count
  INDUSTRIAL_DEPLOYER: one persistent wallet, very high token count

## Token Risk Correlation

  Typically HIGH. Factory tokens show concentrated holdings.
  All CLUSTER_001 tokens: confirmed insider network candidates.

## operator_risk Estimate

  HIGH (0.80-0.95)
  Rationale: automated infrastructure, wallet rotation, coordinated launches.

## Observations

  CLUSTER_001: 8 creator wallets, 8 tokens, Jun 8-10 2026
  Factory rate: 3-4 new wallets per day
  SOL recycling: ~17 transfers/day between hub and feeder

## Related

  docs/clusters/CLUSTER_001.md
  docs/research/FINDING_002.md (split init variant)