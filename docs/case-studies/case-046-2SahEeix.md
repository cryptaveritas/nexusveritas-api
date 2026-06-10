# CASE-046 — 2SahEeix (pump.fun)

**Date:** 2026-06-10
**Token:** 2SahEeixDPartmSoRmdUS58F9CNt2VLe54epYZCipump
**Chain:** Solana
**DEX:** PumpSwap
**Risk Class:** HIGH → CRITICAL

## Token Signals

| Signal | Value | Flag |
|--------|-------|------|
| Largest Holder | 82% | 🔴 Critical |
| Top 3 Holders | 89% | 🔴 Critical |
| Top 10 Holders | 96% | 🔴 Critical |
| Liquidity | $3,236 (PumpSwap) | 🟡 Low |
| LP Locked | No | 🟡 |
| LP Burned | No | 🟡 |
| Mint Authority | Disabled | ✅ |
| Freeze Authority | Disabled | ✅ |
| Insider Network | Not detected | ✅ |

## Creator Profile

**Address:** XUrKb2aK4jBm77q75EemchVUNRTJyeFQ5KebTJygPhF

| Signal | Value | Flag |
|--------|-------|------|
| Tokens Created | 250+ | 🔴 Serial deployer |
| Wallet Age | 0 days | 🔴 Created same day |
| Total Funding Received | 0.002 SOL | 🔴 Init amount |
| Funder Count | 2 | 🟡 Split init |

## Funding Graph

```
Funder A: 4MwJahKsqKEp7HCF7QA4cuGr4YZ4Ad6CjfNXn1TpPba1
  -> 0.001 SOL -> Creator (1 tx, single purpose)

Funder B: FFFSaHpGgSMJVH6GDFbAxnmcAVj3rEYDKc7r1UWoX5nS
  -> 0.001 SOL -> Creator (1 tx, single purpose)

Total: 0.002 SOL (standard Solana account initialization)
```

Both funder wallets: no incoming transfers, single outgoing transaction.

## Behavioral Signals

| Signal | Value |
|--------|-------|
| split_init_pattern | true — 0.002 SOL split across 2 wallets |
| single_purpose_funders | true — each funder used only once |
| wallet_rotation | true — wallet_age=0 + creator_tokens=250+ |
| wallet_factory | candidate — init amount matches CLUSTER_001 |

## Key Finding

The combination of wallet_age=0 and creator_tokens=250+ is the
strongest signal in this case. A fresh wallet linked to a serial
deployer suggests address rotation — a known operator tactic.

The split initialization (2×0.001 SOL vs standard 1×0.002 SOL)
matches the total initialization amount observed in CLUSTER_001
but uses a different funding structure.

## Cluster Relevance

Not assigned to a confirmed cluster.
Behavioral profile resembles CLUSTER_001 class.
Status: independent observation, candidate for Fingerprint Engine validation.

## Related

- docs/clusters/CLUSTER_001.md
- docs/research/FINDING_002.md