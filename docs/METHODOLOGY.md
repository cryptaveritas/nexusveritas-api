# NexusVeritas — Methodology

## How NexusVeritas Differs

| Platform | Focus | Method |
|----------|-------|--------|
| DexScreener | Token Discovery | Price/volume data |
| Rugcheck | Contract Risk | On-chain contract state |
| Bubblemaps | Wallet Distribution | Token holder graph |
| Arkham | Wallet Attribution | Entity labeling |
| NexusVeritas | Operator Attribution | Behavioral fingerprinting |

## Analysis Layers

```
Token Layer         analyze a single token
Creator Layer       analyze who deployed it
Funding Layer       analyze who funded the creator
Behavior Layer      analyze HOW the creator operates
Fingerprint Layer   score behavioral similarity
Operator Layer      attribute to known operator clusters
```

## Signal Categories

### Structural
- wallet_age_days
- funding_concentration
- funding_sources_count

### Behavioral
- transfer_count (feeder_pattern)
- transfer_cadence (automated vs manual)
- recycling_loop (mutual SOL transfers)
- init_amount (wallet_factory = 0.002 SOL)

### Operational
- tokens_created
- creation_frequency
- active_days
- launch_density

## Confidence Levels

| Level | Criteria |
|-------|----------|
| candidate | 1 signal, funding overlap only |
| probable | 2-3 signals, mixed evidence |
| confirmed | 3+ independent signals |

## Research Evolution

Phase 1 — Token Analysis (v0.1-v0.7)
Phase 2 — Creator Attribution (v0.8)
Phase 3 — Funding Graph Analysis (v0.8.1)
Phase 4 — Operator Fingerprinting (v0.9, current)