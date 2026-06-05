# NexusVeritas — Roadmap

NexusVeritas is evolving from a token scanner into a **Risk Intelligence Platform** for the Solana ecosystem.

The architecture is built in data layers, not isolated features. Each layer produces an asset that powers the next.

## Architecture Layers

```
Token Layer          — analyze a single token         (current)
Creator Layer        — analyze the subject behind it
Cluster Layer        — analyze coordinated wallet networks
Temporal Layer       — analyze risk over time
Infrastructure Layer — batch, webhooks, feeds
Identity Layer       — on-chain ↔ off-chain anchoring
```

## Completed (v0.1 – v0.7)

- v0.1.0 — Risk Engine MVP
- v0.2.0 — Real Solana RPC integration
- v0.3.0 — Token Age Analysis
- v0.4.0 — Burner Registry
- v0.4.1 — Rate limiting, fail-safe, validation
- v0.5.0 — Creator Wallet Analysis
- v0.6.0 — Whale Dominance
- v0.7.0 — Liquidity Analysis

**Current capability:** 8 risk signals, deterministic scoring, live on Solana mainnet.

## Planned

### v0.8.0 — Insider Network Detection + Confidence Breakdown
Closes the critical blind spot in Whale Dominance: a single owner splitting supply across many wallets. Maps funding relationships between top holders to reveal coordinated control.

Confidence Breakdown exposes each signal's contribution to the final score — reinforcing the deterministic, explainable model.

```json
{
  "score": 75,
  "contributors": {
    "creatorAnalysis": 30,
    "whaleDominance": 20,
    "liquidity": 15,
    "tokenAge": 10
  }
}
```

### v0.9.0 — Risk Score History
Temporal layer. Stores risk scores over time, creating a data asset that powers future alerts, trends, and comparative analytics.

```
Day 1: 20  →  Day 2: 25  →  Day 3: 40  →  Day 4: 75
```

### v1.0.0 — Early Dump Detection
Detects creators selling a large portion of holdings within minutes of launch — a classic rug pull signal.

### v1.1.0 — Cross-Token Tracking + GET /risk/creator
The shift from analyzing tokens to analyzing subjects. Builds a reputation profile across all tokens a creator has launched.

```json
GET /risk/creator/:address
{
  "creator": "...",
  "tokensCreated": 47,
  "rugged": 18,
  "averageLifetimeDays": 11,
  "riskScore": 92
}
```

### v1.2.0 — Batch Endpoint
```
POST /risk/batch
```
For portfolio scanners and dashboards — analyze many addresses in one request.

### v1.3.0 — Webhooks
POST notifications when a token changes risk class. Built for bots and monitoring tools.

### v1.4.0 — Social Anchoring
Integration with CryptaVeritas Commit-Reveal protocol — verifiable 1:1 mapping between social identity and wallet.

### v1.5.0 — GET /risk/cluster + Trust Graph
Full cluster intelligence. The reputation moat — the longer the engine runs, the more valuable the Trust Graph becomes.

## Long-Term Vision

```
GET  /risk/token       — analyze a token
GET  /risk/creator     — analyze a creator
GET  /risk/cluster     — analyze a wallet network
GET  /risk/history     — analyze risk over time
POST /risk/batch       — analyze in bulk
```

Other projects query NexusVeritas and build their products on top of it — Risk Intelligence infrastructure for Solana, not just another token checker.
