# NexusVeritas — Project Map

## What NexusVeritas Does

Most tools analyze tokens.
NexusVeritas analyzes the operators behind them.

## Analysis Pipeline

```
Token
  what is being launched
  ↓
Creator
  who deployed it
  ↓
Funding Graph
  who funded the creator, how, and how often
  ↓
Behavior Profile
  structural + behavioral + operational signals
  ↓
Fingerprint Score
  0.0 - 1.0  how operator-like is this creator
  ↓
Cluster
  group of creators sharing behavioral fingerprint
  ↓
Operator
  attributed entity behind the cluster
```

## Repository Structure

```
src/                    Core risk engine (TypeScript)
  solanaAdapter.ts      Solana RPC + signal collection
  riskEngine.ts         Scoring logic
  index.ts              API server

data/                   Registry files
  knownServices.json    Exchange/service wallet whitelist
  burnerRegistry.json   Known burner wallets
  clusters.json         Confirmed cluster data
  snapshots/            Daily pipeline snapshots

pipeline scripts        Operator discovery automation
  find_tokens.js        Collect tokens by liquidity
  enrich_creators.js    Get creator per token
  find_hubs.js          L1+L2 funding hub analysis
  build_graph.js        Funding graph construction
  pipeline.sh           Full automated run

docs/
  METHODOLOGY.md        How NexusVeritas differs
  FINGERPRINT_ENGINE.md Behavioral fingerprinting strategy
  ROADMAP.md            Version history and plan
  case-studies/         45 documented token investigations
  operators/            7 operator profiles
  clusters/             Confirmed behavioral clusters
  research/             Experimental findings
```

## Current State (v0.8.2)

```
Completed
  9 risk signals (token level)
  Creator attribution
  Funding graph engine
  Automated discovery pipeline
  CLUSTER_001 confirmed
  45 case studies
  7 operator profiles

In Progress
  Behavioral Fingerprint Engine (v0.9)
  Operator clustering via fingerprint similarity

Planned
  Operator Profiles API
  Operator Alerts
  B2B API
```

## Key Research Finding

After 85 automated creator analyses:
  Funding overlap (L1/L2) -> 0 clusters detected
  Behavioral analysis     -> CLUSTER_001 confirmed

Conclusion: operators are detected through behavior, not wallet connections.
See docs/research/FINDING_001.md

## Competitive Position

```
DexScreener    Token prices and discovery
Rugcheck       Smart contract risk flags
Bubblemaps     Token holder distribution
Arkham         Wallet-to-entity labeling
NexusVeritas   Creator-to-operator attribution
               via behavioral fingerprinting
```