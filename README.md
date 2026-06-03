# NexusVeritas API v0.3

REST API for Solana token risk assessment. Connected to Solana mainnet via Helius RPC.

## Changelog

### v0.3.0
- Token Age Analysis with reliability validation
- Age penalty only when creation time is reliably determined
- No false positives for established tokens (USDC, BONK, JUP)

### v0.2.0
- Real Solana mainnet integration via Helius RPC
- Top holder concentration analysis
- Sample results in README

### v0.1.0
- Risk Engine MVP
- Mint authority detection
- Freeze authority detection

## Endpoints

### GET /api/risk/solana/:address

```
GET /api/risk/solana/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### GET /api/risk/solana/:address?debug=true

Returns full snapshot including token metadata and age reliability flag.

## Risk Signals (v0.3)

- Mint authority enabled (+25)
- Freeze authority enabled (+15)
- LP unlocked (+25)
- Top holders concentration >= 70% (+15)
- Token age < 1h (+20, reliable only)
- Token age < 6h (+15, reliable only)
- Token age < 24h (+10, reliable only)

## Sample Results (Solana Mainnet)

| Token | Score | Class | Notes |
|-------|-------|-------|-------|
| USDC  | 40    | MEDIUM | Mint + Freeze authority (Circle controlled) |
| BONK  | 0     | LOW    | No risk factors |
| JUP   | 0     | LOW    | No risk factors |
| New pump.fun token | 20 | MEDIUM | Age < 1h detected |

## Risk Classes

| Class    | Score  | Action         |
|----------|--------|----------------|
| LOW      | 0–19   | Allowed        |
| MEDIUM   | 20–59  | Warning        |
| HIGH     | 60–84  | Strong warning |
| CRITICAL | 85–100 | Hard refuse    |

## Stack

TypeScript · Node.js · Express · Helius RPC

## Architecture

Risk scoring logic shown in this repository represents the public MVP ruleset. Advanced behavioral analysis, simulation modules, and proprietary heuristics are implemented in the private NexusVeritas Core.

## Part of Veritas Ecosystem

- [CryptaVeritas](https://github.com/cryptaveritas) — signal verification protocol
- NexusVeritas — multichain token risk engine (this repo)
