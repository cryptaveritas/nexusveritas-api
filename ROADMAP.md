# NexusVeritas — Roadmap

NexusVeritas is evolving from a token scanner into a behavioral
Operator Intelligence Platform for the Solana ecosystem.

## Architecture

```
Token Layer          analyze a single token
Creator Layer        analyze who deployed it
Funding Layer        analyze who funded the creator
Behavior Layer       analyze HOW the creator operates       <- current
Fingerprint Layer    score behavioral similarity
Operator Layer       attribute to known operator clusters
Intelligence Layer   alerts, batch, B2B API
```

## Completed

- v0.1.0  Risk Engine MVP
- v0.2.0  Solana RPC integration (Helius)
- v0.3.0  Token Age Analysis
- v0.4.0  Burner Registry
- v0.5.0  Creator Wallet Analysis
- v0.6.0  Whale Dominance
- v0.7.0  Liquidity Analysis (DexScreener)
- v0.8.0  Insider Network Detection + Confidence Breakdown
- v0.8.1  Funding Graph Engine (find_hubs, build_graph, pipeline)
- v0.8.2  CLUSTER_001 confirmed — first behavioral cluster discovery

## In Progress

### v0.9.0 — Behavioral Fingerprint Engine

Replaces funding overlap as primary operator detection mechanism.
Scores each creator across three signal categories:

```json
{
  "fingerprint_score": 0.89,
  "structural":   { "wallet_age_days": 6, "funding_concentration": 1.0 },
  "behavioral":   { "transfer_count": 53, "recycling_loop": 1.0, "feeder_pattern": 0.92 },
  "operational":  { "wallet_factory": 0.87, "automated_cadence": 0.75 }
}
```

### v0.9.1 — Operator Clustering via Fingerprint Similarity

Cluster creators by behavioral similarity instead of funding overlap.
Ground truth: CLUSTER_001 (confidence 0.85).

## Planned

- v1.0.0  Operator Profiles + GET /risk/creator
- v1.1.0  Operator Alerts (new cluster detected)
- v1.2.0  Snapshot Intelligence (risk score history)
- v1.3.0  Batch Endpoint
- v1.4.0  Webhooks
- v1.5.0  B2B API + Trust Graph


## Current Completion

```
Token Risk Engine           80%   9 signals, live on mainnet
Operator Discovery          60%   pipeline, funding graph, CLUSTER_001
Behavior Profiling          40%   behavior_profile v0, 3 archetypes
Operator Classification     15%   archetypes defined, classifier not built
Operator Attribution        10%   manual only, no automation
```

## Next Milestone

First automatic classification output:

  "operator_class": "INDUSTRIAL_DEPLOYER"
  "confidence": 0.87
  "matched_signals": [...]

When this runs on fresh data without manual analysis,
Fingerprint Engine will be live.

## Operator Archetypes (draft baselines)

```
CASUAL_CREATOR        operator_risk: LOW
PROFESSIONAL_CREATOR  operator_risk: LOW-MEDIUM
INDUSTRIAL_DEPLOYER   operator_risk: NEUTRAL
WALLET_FACTORY        operator_risk: ELEVATED
ROTATION_OPERATOR     operator_risk: HIGH
INFRASTRUCTURE_HUB    operator_risk: UNKNOWN
```

Baselines are directional only — no scores assigned until
10+ observations per archetype.

## Research

Finding #001 — Funding overlap insufficient for operator attribution
See docs/research/FINDING_001.md

CLUSTER_001 — First confirmed behavioral cluster
See docs/clusters/CLUSTER_001.md