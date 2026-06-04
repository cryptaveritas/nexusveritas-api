# NexusVeritas API

Solana security intelligence API with real-time multi-signal risk scoring.

## Overview

NexusVeritas has evolved from a simple token checker into a multi-signal Solana risk engine. It accepts any Solana token address and returns a deterministic risk score based on 8 independent on-chain signals.

## Current Risk Signals (v0.7.0)

- Mint Authority Analysis
- Freeze Authority Analysis
- Holder Concentration
- Token Age Analysis
- Burner Wallet Detection
- Creator Wallet Analysis
- Whale Dominance
- Liquidity Analysis

## Validation on Real Tokens

| Token | Score | Class | Notes |
|-------|-------|-------|-------|
| BONK  | 0     | LOW    | Clean — no risk factors |
| USDC  | 40    | MEDIUM | Mint + Freeze authority (Circle controlled) |
| SOLARSYS (pump.fun) | 85 | CRITICAL | Low liquidity + young token |
| Known scam cluster | 100 | CRITICAL | Serial deployer + whale dominance + zero liquidity |

## Endpoints

### GET /api/risk/solana/:address

```json
{
  "address": "3RPv...",
  "chain": "solana",
  "score": 100,
  "class": "CRITICAL",
  "reasons": [
    "Mint authority enabled",
    "Freeze authority enabled",
    "Top holders concentration is 100%",
    "Serial token deployer — creator launched 96+ tokens",
    "Single whale controls 76% of supply",
    "Top 3 wallets control 97% of supply",
    "No liquidity pool found"
  ],
  "confidence": "standard"
}
```

### GET /api/risk/solana/:address?debug=true

Returns full snapshot including all analysis modules.

### GET /health

```json
{ "status": "ok", "version": "0.7.0" }
```

## Risk Classes

| Class    | Score  | Action         |
|----------|--------|----------------|
| LOW      | 0–19   | Allowed        |
| MEDIUM   | 20–59  | Warning        |
| HIGH     | 60–84  | Strong warning |
| CRITICAL | 85–100 | Hard refuse    |

## Changelog

- **v0.7.0** — Liquidity Analysis via DexScreener
- **v0.6.0** — Whale Dominance Analysis
- **v0.5.0** — Creator Wallet Analysis, serial deployer detection
- **v0.4.1** — Rate limiting, fail-safe, snapshot validation
- **v0.4.0** — Burner Registry detection
- **v0.3.0** — Token Age Analysis with reliability validation
- **v0.2.0** — Real Solana RPC integration via Helius
- **v0.1.0** — Risk Engine MVP

## Stack

TypeScript · Node.js · Express · Helius RPC · DexScreener API

## Architecture Note

Risk scoring logic in this repository represents the public MVP ruleset. Advanced behavioral analysis, simulation modules, and proprietary heuristics are implemented in the private NexusVeritas Core.

## Part of Veritas Ecosystem

- [CryptaVeritas](https://github.com/cryptaveritas) — signal verification protocol
- NexusVeritas — multichain token risk engine (this repo)
