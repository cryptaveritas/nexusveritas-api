# NexusVeritas API

Solana security intelligence API with real-time risk scoring and on-chain analysis.

## Current Status

**Version: v0.4.1**

NexusVeritas analyzes real Solana mainnet tokens through Helius RPC and returns deterministic risk scores based on on-chain data. Architecture is designed for future multichain expansion.

## Current Risk Signals

- Mint Authority Analysis
- Freeze Authority Analysis
- Holder Concentration Analysis
- Token Age Analysis
- Burner Wallet Detection
- Reliability Validation
- Confidence Scoring

## Architecture

```
Client
  ↓
NexusVeritas API
  ↓
Solana Adapter (Helius RPC)
  ↓
Risk Engine
  ↓
Risk Score + Reasons
```

## Endpoints

### GET /api/risk/solana/:address

```json
{
  "address": "EPjFWdd5...",
  "chain": "solana",
  "score": 40,
  "class": "MEDIUM",
  "reasons": [
    "Mint authority enabled — unlimited supply inflation risk",
    "Freeze authority enabled — blacklist/pause possible"
  ],
  "confidence": "standard"
}
```

### GET /api/risk/solana/:address?debug=true

Returns full snapshot including token metadata.

### GET /health

```json
{ "status": "ok", "version": "0.4.1" }
```

## Risk Classes

| Class    | Score  | Action         |
|----------|--------|----------------|
| LOW      | 0–19   | Allowed        |
| MEDIUM   | 20–59  | Warning        |
| HIGH     | 60–84  | Strong warning |
| CRITICAL | 85–100 | Hard refuse    |

## Sample Results (Solana Mainnet)

| Token | Score | Class | Notes |
|-------|-------|-------|-------|
| USDC  | 40    | MEDIUM | Mint + Freeze authority (Circle controlled) |
| BONK  | 0     | LOW    | No risk factors detected |
| JUP   | 0     | LOW    | No risk factors detected |
| New pump.fun token | 20 | MEDIUM | Age < 1h detected |

## Changelog

- **v0.4.1** — Rate limiting, fail-safe handling, snapshot validation, audit log
- **v0.4.0** — Burner Registry, known suspicious wallet detection
- **v0.3.0** — Token Age Analysis with reliability validation
- **v0.2.0** — Real Solana RPC integration, holder concentration analysis
- **v0.1.0** — Risk Engine MVP

## Stack

TypeScript · Node.js · Express · Helius RPC

## Architecture Note

Risk scoring logic in this repository represents the public MVP ruleset. Advanced behavioral analysis, simulation modules, and proprietary heuristics are implemented in the private NexusVeritas Core.

## Part of Veritas Ecosystem

- [CryptaVeritas](https://github.com/cryptaveritas) — signal verification protocol
- NexusVeritas — multichain token risk engine (this repo)
