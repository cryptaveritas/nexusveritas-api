# NexusVeritas — Project Map

## What NexusVeritas Does

Most crypto analytics platforms analyze tokens, contracts, or wallets.
NexusVeritas analyzes the operators and infrastructure behind them.

## Why This Matters

Wallets change.
Operators adapt.
Behavior leaves fingerprints.

A creator wallet can be replaced in minutes.
An operator's behavioral patterns are much harder to change.

NexusVeritas focuses on behavioral signals that persist across
wallets, tokens, and infrastructure rotations.

## Analysis Architecture

```
TOKEN                          CREATOR
  ↓                              ↓
Token Risk Engine            Behavior Profile
  ↓                              ↓
holder concentration         structural signals
liquidity                    behavioral signals
LP status                    operational signals
mint/freeze authority              ↓
  ↓                        Operator Classification
TOKEN RISK SCORE                   ↓
                           CASUAL_CREATOR
                           INDUSTRIAL_DEPLOYER
                           WALLET_FACTORY
                           ROTATION_OPERATOR
                           INFRASTRUCTURE_HUB
                                   ↓
                           OPERATOR RISK SCORE
                                   ↓
              Combined Intelligence
  token_risk: 82  +  operator_risk: 18
```

**Validation result (VALIDATION_001):** 8/8 CLUSTER_001 wallets → WALLET_FACTORY (confidence 1.0)
**DB Status:** 565 creators, 8 archetypes, pgvector similarity search live
**API:** GET /api/v2/scan/solana/:mint → score + reasons + isHardRefuse

**Key finding (FINDING_003):** operator_class ≠ token_risk — operator class and token risk are independent dimensions. 4 data points across 3 operator classes confirm this.
A high-volume deployer (INDUSTRIAL_DEPLOYER) can produce both HIGH and LOW risk tokens.
This is why NexusVeritas is not another Rugcheck.

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
Behavioral Fingerprint
  similarity scoring across creator population
  ↓
Cluster Detection
  group creators by shared behavioral patterns
  ↓
Operator Attribution
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
  PROJECT_MAP.md        This file
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

In Progress
  Behavioral Fingerprint Engine (v0.9)
  Operator clustering via fingerprint similarity

Planned
  Operator Profiles API
  Operator Alerts
  B2B API

Research Dataset
  45 case studies
  7 operator profiles
  1 confirmed behavioral cluster
  85 creator profiles analyzed
```

## Key Research Finding

```
Finding #001

Dataset:
  85 creator wallets across 3 automated pipeline runs

Result:
  0 meaningful L1/L2 funding overlap clusters

Outcome:
  CLUSTER_001 identified through behavioral signals

Implication:
  Behavioral attribution is more effective than
  funding overlap analysis at current market conditions.
```

See docs/research/FINDING_001.md
See docs/clusters/CLUSTER_001.md

## Competitive Position

```
Platform        Primary Object    Method

DexScreener     Token             Price and volume data
Rugcheck        Contract          On-chain contract state
Bubblemaps      Holders           Token distribution graph
Arkham          Wallet            Entity labeling
NexusVeritas    Operator          Behavioral fingerprinting
```