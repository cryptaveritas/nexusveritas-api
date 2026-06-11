# Signal: ATA_INITIALIZATION_PATTERN

**Status:** False Positive Risk — HIGH
**Discovered:** 2026-06-11 via CLUSTER_002 investigation

## Pattern

  Repeated transfers of 0.002 SOL to multiple wallets
  from a single hub wallet

## Initial Hypothesis

  0.002 SOL × N wallets = WALLET_FACTORY initialization
  (hub creating leaf creator wallets for token launches)

## Investigation Result

  12/12 wallets checked → USDC, JUP, SPL token activity
  NOT new token launches
  These are Associated Token Account (ATA) creation payments

## Root Cause

  Creating an ATA on Solana requires ~0.002 SOL rent-exempt deposit.
  Any wallet preparing to receive USDC/JUP/SPL tokens
  will receive a small SOL transfer first.
  This is identical in amount to wallet factory initialization.

## Pattern vs Meaning

  Pattern: 0.002 SOL transfer
  Meaning A: WALLET_FACTORY leaf initialization → new token launch
  Meaning B: ATA creation → stablecoin/DeFi activity

  Amount alone cannot distinguish the two.

## Required Disambiguation

  Check downstream activity within 24h:
    token_launch_confirmed = true  → WALLET_FACTORY signal
    stablecoin_activity    = true  → ATA creation (not a factory signal)

## V3 Vector Improvement

  Add dimension: token_launch_confirmed
  Replace: init_amount_score (amount-based)
  With:    factory_confirmed_score (behavior-based)

## Related

  CLUSTER_001 — WALLET_FACTORY confirmed (downstream: real token launches)
  CLUSTER_002_CANDIDATE — ATA pattern, not wallet factory