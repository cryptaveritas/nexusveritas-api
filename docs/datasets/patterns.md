# NexusVeritas — Observed Patterns

Real-world data collected from Solana token analysis using NexusVeritas v0.8.0.

Last updated: 2026-06-08

## Signal Statistics

| Signal | Count | % of analyzed |
|--------|-------|---------------|
| Insider Network | 2 | 40% |
| Serial Deployer | 3 | 60% |
| LP Unlocked | 4 | 80% |
| Whale >25% | 3 | 60% |
| Low Liquidity | 3 | 60% |
| Token Age <6h | 2 | 40% |

*Based on 5 investigated cases*

## Risk Distribution

| Class | Count |
|-------|-------|
| CRITICAL | 2 |
| HIGH | 0 |
| MEDIUM | 3 |
| LOW | 0 |

## Insider Network Observations

- Cluster size range: 4-5 wallets
- Supply coverage range: 10%
- Funding wallet patterns:
  - Active (733 SOL+): 1 case
  - Depleted (0 SOL): 1 case

## Serial Deployer Observations

- Range: 10-28 tokens per creator
- Always combined with other risk signals
- Most common co-signal: LP unlocked

## Notes

- pump.fun tokens excluded from insider network analysis (bonding curve masks patterns)
- All cases are custom Solana deploys
- Dataset will grow as more tokens are analyzed
